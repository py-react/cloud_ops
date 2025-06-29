import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form";

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { NetworkIcon } from "lucide-react";
import RouteDescription from "@/components/route-description";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import yaml from "js-yaml";
import useNavigate from "@/libs/navigate";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Type", accessor: "type" },
  { header: "Cluster IP", accessor: "clusterIP" },
  { header: "External IP", accessor: "externalIP" },
  { header: "Ports", accessor: "ports" },
  { header: "Age", accessor: "age" },
];

interface ServiceData {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
}

export default function ServicesPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<ServiceData | null>(null);
  const {
    resource: services,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "services",
  });

  const handleViewDetails = (service: any) => {
    navigate(`/orchestration/kubernetes/${service.namespace}/services/${service.name}`)
  };

  // Transform API data to match table format
  const transformedServices: ServiceData[] =
    services?.map((service: any) => {
      const ports = service.spec?.ports || [];
      const portsDisplay = ports.map((port: any) => 
        `${port.port}${port.targetPort ? `:${port.targetPort}` : ''}`
      ).join(', ');

      return {
        name: service.metadata?.name || "",
        namespace: service.metadata?.namespace || "",
        type: service.spec?.type || "ClusterIP",
        clusterIP: service.spec?.clusterIP || "None",
        externalIP: service.status?.loadBalancer?.ingress?.[0]?.ip || 
                   service.spec?.externalIPs?.[0] || 
                   "N/A",
        ports: portsDisplay || "N/A",
        age: service.metadata?.creationTimestamp 
          ? new Date(service.metadata.creationTimestamp).toLocaleDateString()
          : "Unknown",
        last_applied: service.metadata?.annotations?.["kubectl.kubernetes.io/last-applied-configuration"],
        fullData: service,
        showViewDetails:true,
        showEdit: true,
        showDelete: true,
      };
    }) || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <NetworkIcon className="h-4 w-4" />
              <h2>Services</h2>
            </div>
          }
          shortDescription="Manage your Kubernetes Services—create, inspect, and control access to workloads running in your cluster."
          description="Services in Kubernetes provide a stable network endpoint to expose applications running on a set of Pods. They abstract away Pod IPs and enable reliable communication within the cluster or to external consumers. Services support different types—ClusterIP, NodePort, LoadBalancer, and ExternalName—each suited for specific use cases."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Services</CardTitle>
              <CardDescription>
                {transformedServices.length} Services found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button onClick={() => setShowCreateDialog(true)}>
                <NetworkIcon className="w-4 h-4 mr-2" />
                Create Service
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedServices}
              onViewDetails={handleViewDetails}
              onEdit={(res: ServiceData) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data: ServiceData) => {
                let manifest = data.last_applied 
                  ? yaml.dump(JSON.parse(data.last_applied)) 
                  : "";
                if (!manifest) {
                  manifest = yaml.dump({
                    apiVersion: data.fullData.apiVersion,
                    kind: data.fullData.kind,
                    metadata: {
                      name: data.fullData.metadata.name,
                      namespace: data.fullData.metadata.namespace,
                    },
                  });
                }
                DefaultService.apiKubernertesMethodsDeletePost({
                  requestBody: {
                    manifest: manifest,
                  },
                })
                  .then((res: any) => {
                    if (res.success) {
                      toast.success(res.data.message);
                      refetch();
                    } else {
                      toast.error(res.error);
                    }
                  })
                  .catch((err) => {
                    toast.error(err);
                  });
              }}
            />
          </CardContent>
        </Card>
      </div>
      {showCreateDialog && (
        <ResourceForm
          heading="Service resource"
          description="A Kubernetes Service is a resource that provides a stable network endpoint to expose applications running on a set of Pods. Services abstract away Pod IPs and enable reliable communication within the cluster or to external consumers. They support different types—ClusterIP, NodePort, LoadBalancer, and ExternalName—each suited for specific use cases."
          editDetails={showCreateDialog}
          rawYaml={
            currentToEdit
              ? yaml.dump(
                  currentToEdit?.last_applied
                    ? JSON.parse(currentToEdit?.last_applied)
                    : currentToEdit.fullData
                )
              : ""
          }
          resourceType="services"
          onClose={() => {
            setShowCreateDialog(false);
            setCurrentToEdit(null);
          }}
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res: any) => {
                if (res.success) {
                  toast.success(res.data.message);
                  refetch();
                  setShowCreateDialog(false);
                } else {
                  toast.error(res.error);
                }
              })
              .catch((err) => {
                toast.error(err);
              });
          }}
        />
      )}
    </div>
  );
}


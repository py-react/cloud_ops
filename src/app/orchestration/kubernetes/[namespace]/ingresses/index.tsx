import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form";

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { RouteIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
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
  { header: "Class", accessor: "ingressClass" },
  { header: "Hosts", accessor: "hosts" },
  { header: "Address", accessor: "address" },
  { header: "Ports", accessor: "ports" },
  { header: "Age", accessor: "age" },
];

interface IngressData {
  name: string;
  namespace: string;
  ingressClass: string;
  hosts: string;
  address: string;
  ports: string;
  age: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
}

export default function IngressPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<IngressData | null>(null);
  const {
    resource: ingress,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "ingresses",
  });

  const handleViewDetails = (ingress: any) => {
    navigate(`/orchestration/kubernetes/${ingress.namespace}/ingresses/${ingress.name}`)
  };

  // Transform API data to match table format
  const transformedIngress: IngressData[] =
    ingress?.map((ing: any) => {
      const hosts = ing.spec?.rules?.map((rule: any) => rule.host).filter(Boolean) || [];
      const hostsDisplay = hosts.length > 0 ? hosts.join(', ') : 'N/A';

      const addresses = ing.status?.loadBalancer?.ingress || [];
      const addressDisplay = addresses.length > 0
        ? addresses.map((addr: any) => addr.ip || addr.hostname).join(', ')
        : 'N/A';

      const ports = ing.spec?.rules?.flatMap((rule: any) =>
        rule.http?.paths?.map((path: any) =>
          path.backend?.service?.port?.number || path.backend?.service?.port?.name || 'N/A'
        ) || []
      ) || [];
      const portsDisplay = Array.from(new Set(ports)).join(', ') || 'N/A';

      return {
        name: ing.metadata?.name || "",
        namespace: ing.metadata?.namespace || "",
        ingressClass: ing.spec?.ingressClassName ||
          ing.metadata?.annotations?.['kubernetes.io/ingress.class'] ||
          'N/A',
        hosts: hostsDisplay,
        address: addressDisplay,
        ports: portsDisplay,
        age: ing.metadata?.creationTimestamp
          ? new Date(ing.metadata.creationTimestamp).toLocaleDateString()
          : "Unknown",
        last_applied: ing.metadata?.annotations?.["kubectl.kubernetes.io/last-applied-configuration"],
        fullData: ing,
        showViewDetails: true,
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
    <PageLayout
      title="Ingress"
      subtitle="Manage your Kubernetes Ingress resources—configure external access to your services."
      icon={RouteIcon}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector />
          <Button onClick={() => setShowCreateDialog(true)}>
            <RouteIcon className="w-4 h-4 mr-2" />
            Create Ingress
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Ingress</CardTitle>
              <CardDescription>
                {transformedIngress.length} Ingress resources found
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              onViewDetails={handleViewDetails}
              columns={columns}
              data={transformedIngress}
              onEdit={(res: IngressData) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data: IngressData) => {
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
          heading="Ingress resource"
          description="A Kubernetes Ingress resource provides HTTP and HTTPS routing to services within the cluster. It acts as an entry point for external traffic and can handle load balancing, SSL termination, and name-based virtual hosting. Ingress controllers implement the actual routing logic based on these resource definitions."
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
          resourceType="ingress"
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
    </PageLayout>
  );
}


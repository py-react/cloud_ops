import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form";

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { BoxIcon } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Status", accessor: "status" },
  { header: "Ready", accessor: "ready" },
  { header: "Restarts", accessor: "restarts" },
  { header: "Age", accessor: "age" },
  { header: "IP", accessor: "podIP" },
  { header: "Node", accessor: "nodeName" },
];

interface PodData {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  podIP: string;
  nodeName: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
}

export default function PodsPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<PodData | null>(null);
  const {
    resource: pods,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "pods",
  });

  const handleViewDetails = (pod: any) => {
    navigate(`/orchestration/kubernetes/${pod.namespace}/pods/${pod.name}`)
  };

  // Transform API data to match table format
  const transformedPods: PodData[] =
    pods?.map((pod: any) => {
      const containerStatuses = pod.status?.containerStatuses || [];
      const totalRestarts = containerStatuses.reduce(
        (sum: number, container: any) => sum + (container.restartCount || 0),
        0
      );
      const readyContainers = containerStatuses.filter(
        (container: any) => container.ready
      ).length;
      const totalContainers = containerStatuses.length;

      return {
        name: pod.metadata?.name || "",
        namespace: pod.metadata?.namespace || "",
        status: pod.status?.phase || "Unknown",
        ready: `${readyContainers}/${totalContainers}`,
        restarts: totalRestarts,
        age: pod.metadata?.creationTimestamp
          ? new Date(pod.metadata.creationTimestamp).toLocaleDateString()
          : "Unknown",
        podIP: pod.status?.podIP || "N/A",
        nodeName: pod.spec?.nodeName || "N/A",
        last_applied:
          pod.metadata?.annotations?.[
          "kubectl.kubernetes.io/last-applied-configuration"
          ],
        fullData: pod,
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
      title="Pods"
      subtitle="Manage your Kubernetes Pods—inspect status, view logs, restart, or delete running workloads."
      icon={BoxIcon}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector />
          <Button onClick={() => setShowCreateDialog(true)}>
            <BoxIcon className="w-4 h-4 mr-2" />
            Create Pod
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Pods</CardTitle>
              <CardDescription>
                {transformedPods.length} Pods found
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedPods}
              onViewDetails={handleViewDetails}
              onEdit={(res: PodData) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data: PodData) => {
                let menifest = data.last_applied
                  ? yaml.dump(JSON.parse(data.last_applied))
                  : "";
                if (!menifest) {
                  menifest = yaml.dump({
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
                    manifest: menifest,
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
          heading="Pod resource"
          description="A Kubernetes Pod is the smallest and most fundamental compute unit in the Kubernetes object model. Each Pod encapsulates one or more containers that share the same network namespace and storage. Pods are designed to run a single instance of a process and are managed by higher-level controllers like Deployments, ReplicaSets, and StatefulSets."
          editDetails={showCreateDialog}
          rawYaml={
            currentToEdit
              ? yaml.dump(
                currentToEdit?.last_applied
                  ? JSON.parse(currentToEdit?.last_applied)
                  : (() => {
                    const {
                      managedFields,
                      ...metadataWithoutManagedFields
                    } = currentToEdit.fullData.metadata;
                    return {
                      ...currentToEdit.fullData,
                      metadata: metadataWithoutManagedFields,
                    };
                  })()
              )
              : ""
          }
          resourceType="pods"
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

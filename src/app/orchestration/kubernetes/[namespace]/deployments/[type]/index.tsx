import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form"

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { RocketIcon, Box, Settings, Server, HardDrive, Network, Shield, Activity } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Wizard } from "@/components/wizard/wizard";
import yaml from "js-yaml"
import { useParams } from "react-router-dom";
import useNavigate from "@/libs/navigate";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Replicas", accessor: "replicas" },
  { header: "Ready", accessor: "readyReplicas" },
  { header: "Strategy", accessor: "strategy" },
  // { header: "Labels", accessor: "labels" },
  { header: "Status", accessor: "status" },
];

export default function DeploymentsPage() {
  const navigate = useNavigate()
  const { namespace, type } = useParams()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<any>(null);

  const resourceType = type || "deployments";

  const {
    resource: deployments,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: resourceType,
  });

  // Transform API data to match DeploymentItem type
  const transformedDeployments =
    deployments?.map((dep: any) => {
      // Conditionally set replicas and readyReplicas based on resource type
      let replicas = 0;
      let readyReplicas = 0;
      let strategy = "";

      if (resourceType === "statefulsets") {
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = dep.spec?.updateStrategy?.type || "RollingUpdate";
      } else if (resourceType === "daemonsets") {
        replicas = dep.status?.desiredNumberScheduled || 0;
        readyReplicas = dep.status?.numberReady || 0;
        strategy = dep.spec?.updateStrategy?.type || "RollingUpdate";
      } else if (resourceType === "replicasets") {
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = "ReplicaSet"; // ReplicaSets don't have update strategies
      } else {
        // Default for deployments and other resources
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = dep.spec?.strategy?.type || "RollingUpdate";
      }

      return {
        name: dep.metadata?.name || "",
        namespace: dep.metadata?.namespace || "",
        replicas: replicas,
        readyReplicas: readyReplicas,
        strategy: strategy,
        labels: Object.entries(dep.metadata?.labels || {}).map(
          ([key, value]) => `${key}: ${value as string}`
        ),
        status: inferStatus(
          dep.status,
          resourceType,
          dep.status?.conditions
        ),
        last_applied:
          dep.metadata?.annotations[
          "kubectl.kubernetes.io/last-applied-configuration"
          ],
        fullData: dep,
        showEdit: true,
        showDelete: true,
        showViewDetails: true,
      };
    }) || [];

  const handleViewDetails = (deployment: any) => {
    navigate(`/orchestration/kubernetes/${deployment.namespace}/deployments/${type}/${deployment.name}`)
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageLayout
      title={resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
      subtitle="View and manage Kubernetes Deployments—deploy and update your applications."
      icon={RocketIcon}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector />
          <Button onClick={() => setShowCreateDialog(true)}>
            <RocketIcon className="w-4 h-4 mr-2" />
            Create {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}</CardTitle>
              <CardDescription>
                {transformedDeployments.length} {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} found
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedDeployments}
              onViewDetails={handleViewDetails}
              onEdit={(res) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data) => {
                let manifest = yaml.dump(JSON.parse(data.last_applied));
                if (!Object.keys(data.last_applied).length) {
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
                  .then((res) => {
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
          heading="Deployment resource"
          description="A Kubernetes Deployment is a resource used to manage and automate the rollout and lifecycle of application instances, typically in the form of Pods. It ensures that a specified number of pod replicas are running at all times and allows for declarative updates, rollbacks, and scaling. Deployments are ideal for stateless applications and provide robust features like rolling updates and version control, making them a foundational tool for maintaining reliable and consistent workloads in a Kubernetes cluster."
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
          resourceType="deployments"
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
              .then((res) => {
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

function inferStatus(status: any, resourceType: string, conditions?: any): string {
  // Handle case where conditions is not an array but a status object
  if (["statefulsets", "daemonsets", "replicasets"].includes(resourceType)) {
    // This is likely a status object, not conditions array
    const statusObj = status;

    // Handle different resource types based on their status patterns
    if (resourceType === "statefulsets") {
      // StatefulSet status logic
      const desiredReplicas = statusObj.replicas || 0;
      const readyReplicas = statusObj.readyReplicas || 0;
      const currentReplicas = statusObj.currentReplicas || 0;

      if (readyReplicas === desiredReplicas && currentReplicas === desiredReplicas) {
        return "Running";
      } else if (readyReplicas > 0 && readyReplicas < desiredReplicas) {
        return "Scaling";
      } else if (readyReplicas === 0 && desiredReplicas > 0) {
        return "Pending";
      } else if (statusObj.conditions) {
        // Check conditions for more specific status
        const failedCondition = statusObj.conditions.find((c: any) =>
          c.type === "Failed" && c.status === "True"
        );
        if (failedCondition) return "Failed";
      }
      return "Pending";
    }

    if (resourceType === "daemonsets") {
      // DaemonSet status logic
      const desired = statusObj.desiredNumberScheduled || 0;
      const ready = statusObj.numberReady || 0;
      const available = statusObj.numberAvailable || 0;

      if (ready === desired && available === desired) {
        return "Running";
      } else if (ready > 0 && ready < desired) {
        return "Scaling";
      } else if (ready === 0 && desired > 0) {
        return "Pending";
      } else if (statusObj.conditions) {
        const failedCondition = statusObj.conditions.find((c: any) =>
          c.type === "Failed" && c.status === "True"
        );
        if (failedCondition) return "Failed";
      }
      return "Pending";
    }

    if (resourceType === "replicasets") {
      // ReplicaSet status logic
      const desiredReplicas = statusObj.replicas || 0;
      const readyReplicas = statusObj.readyReplicas || 0;
      const availableReplicas = statusObj.availableReplicas || 0;
      console.log({ desiredReplicas, readyReplicas, availableReplicas })
      if (readyReplicas === desiredReplicas && availableReplicas === desiredReplicas) {
        return "Running";
      } else if (readyReplicas > 0 && readyReplicas < desiredReplicas) {
        return "Scaling";
      } else if (readyReplicas === 0 && desiredReplicas > 0) {
        return "Pending";
      }
      return "Pending";
    }

    // Default fallback for other resource types
    return "Unknown";
  }

  // Handle conditions array (for Deployments and other resources with conditions)
  if (!conditions || conditions.length === 0) return "Unknown";

  const progressingCondition = conditions.find((c: any) => c.type === "Progressing");
  const availableCondition = conditions.find((c: any) => c.type === "Available");
  const readyCondition = conditions.find((c: any) => c.type === "Ready");
  const failedCondition = conditions.find((c: any) => c.type === "Failed");

  // Check for failed state first
  if (failedCondition?.status === "True") {
    return "Failed";
  }

  // Check for available/ready state
  const isAvailable = availableCondition?.status === "True" || readyCondition?.status === "True";
  const isProgressing = progressingCondition?.status === "True";

  if (isAvailable) {
    return "Running";
  } else if (isProgressing) {
    return "Pending";
  } else if (availableCondition?.status === "False" || readyCondition?.status === "False") {
    return "Failed";
  }

  return "Pending";
}

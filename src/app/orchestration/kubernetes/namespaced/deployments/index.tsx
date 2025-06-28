import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form"

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { RocketIcon } from "lucide-react";
import RouteDescription from "@/components/route-description";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DeploymentItem } from "@/components/kubernetes/quick-view-resources/DeploymentList";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import yaml from "js-yaml"

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Replicas", accessor: "replicas" },
  { header: "Ready", accessor: "readyReplicas" },
  { header: "Strategy", accessor: "strategy" },
  { header: "Labels", accessor: "labels" },
  { header: "Status", accessor: "status" },
];

export default function DeploymentsPage() {
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit,setCurrentToEdit] = useState(null)
  const {
    resource: deployments,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "deployments",
  });


  // Transform API data to match DeploymentItem type
  const transformedDeployments =
    deployments?.map((dep: any) => ({
      name:dep.metadata?.name || "",
      namespace: dep.metadata?.namespace || "",
      replicas:dep.spec?.replicas || 0,
      readyReplicas:dep.status?.readyReplicas || 0,
      strategy:dep.spec?.strategy?.type,
      labels:Object.entries(dep.metadata?.labels||{}).map(
        ([key, value]) => `${key}: ${value}`
      ),
      status:inferStatus(dep.status?.conditions),
      last_applied: dep.metadata?.annotations["kubectl.kubernetes.io/last-applied-configuration"],
      fullData: dep,
      showEdit:true,
      showDelete:true,
    })) || [];

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
              <RocketIcon className="h-4 w-4" />
              <h2>Deployments</h2>
            </div>
          }
          shortDescription="View and manage Kubernetes Deployments—deploy and update your applications."
          description="Deployments provide declarative updates for Pods and ReplicaSets. You describe a desired state in a Deployment, and the Deployment Controller changes the actual state to the desired state at a controlled rate."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Deployments</CardTitle>
              <CardDescription>
                {transformedDeployments.length} Deployments found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button onClick={() => setShowCreateDialog(true)}>
                <RocketIcon className="w-4 h-4 mr-2" />
                Create Deployment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedDeployments}
              // onViewDetails={(res) => {
              //   // You can access full deployment object using res.fullData
              //   console.log("View Details for Deployment:", res);
              // }}
              // onViewLogs={(res) => {
              //   console.log("View Logs for Deployment:", res);
              // }}
              onEdit={(res) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data) => {
                DefaultService.apiKubernertesMethodsDeletePost({
                  requestBody: {
                    manifest: yaml.dump(JSON.parse(data.last_applied)),
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
              // onViewConfig={(res) => {
              //   console.log("View Config for Deployment:", res.fullData);
              // }}
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
              ? yaml.dump(JSON.parse(currentToEdit?.last_applied))
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
    </div>
  );
}



function inferStatus(conditions?: DeploymentItem["status"]["conditions"]): string {
  if (!conditions || conditions.length === 0) return "Unknown";
  const progessingCondition = conditions.find(c=>c.type ==="Progressing")
  const readyCondition = conditions.find((c) => c.type === "Available" || c.type === "Ready" );
  if(readyCondition?.status === "False" && progessingCondition?.status === "True") return "Pending"
  if (readyCondition?.status === "True") return "Running";
  if (readyCondition?.status === "False") return "Failed";
  return "Pending";
}

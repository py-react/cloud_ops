import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { DeploymentList } from "@/components/kubernetes/DeploymentList";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import { DeploymentForm } from "@/components/kubernetes/quick-view-resources/forms/deployments/DeploymentForm";
import { DeploymentFormData } from "@/components/kubernetes/quick-view-resources/forms/deployments/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { Loader2, RocketIcon } from "lucide-react";
import RouteDescription from "@/components/route-description";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DeploymentItem } from "@/components/kubernetes/DeploymentList";

export default function DeploymentsPage() {
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    resource: deployments,
    isLoading,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "deployments",
  });

  const handleCreateDeployment = async (data: DeploymentFormData) => {
    function arrayToObject(arr: { key: string, value: string }[]) {
      return arr.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }
    const labels = arrayToObject(data.metadata.labels || []);
    const annotations = arrayToObject(data.metadata.annotations || []);
    const payload = {
      ...data,
      metadata: {
        ...data.metadata,
        labels,
        annotations,
      },
    };
    try {
      const response =
        await DefaultService.apiKubernertesResourcesTypeCreateDeploymentsPost({
          requestBody: payload,
          type: "deployments",
        });
      setShowCreateDialog(false);
      refetch();
      toast.success(`Deployment ${data.metadata.name} created successfully`);
    } catch (error) {
      console.error("Error creating Deployment:", error);
      toast.error(`Failed to create deployment ${data.metadata.name}`);
      throw error;
    }
  };

  // Transform API data to match DeploymentItem type
  const transformedDeployments: DeploymentItem[] =
    deployments?.map((dep: any) => ({
      metadata: {
        uid: dep.metadata?.uid || "",
        name: dep.metadata?.name || "",
        namespace: dep.metadata?.namespace || selectedNamespace || "",
        labels: dep.metadata?.labels || {},
        annotations: dep.metadata?.annotations || {},
      },
      spec: {
        replicas: dep.spec?.replicas || 0,
        strategy: {
          type: dep.spec?.strategy?.type,
        },
        selector: {
          matchLabels: dep.spec?.selector?.matchLabels || {},
        },
        template: {
          spec: {
            containers: dep.spec?.template?.spec?.containers || [],
          },
        },
      },
      status: {
        readyReplicas: dep.status?.readyReplicas || 0,
        conditions: dep.status?.conditions || [],
      },
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
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            ) : (
              <DeploymentList deployments={transformedDeployments} />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <RocketIcon className="h-5 w-5" />
              Deployment Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <DeploymentForm
              onSubmit={handleCreateDeployment}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

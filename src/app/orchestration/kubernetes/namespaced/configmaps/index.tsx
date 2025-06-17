import React, { useState, useContext } from "react";
import { useKubernertesResources } from "@/hooks/use-resource";
import { ConfigMapList } from '@/components/kubernetes/quick-view-resources/ConfigMapList';
import { ConfigMapForm } from "@/components/kubernetes/quick-view-resources/forms/ConfigMapForm";
import { ConfigMapFormData } from "@/components/kubernetes/quick-view-resources/forms/types";
import { toast } from "sonner";
import { Loader2, ContainerIcon } from "lucide-react";
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector';
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext';
import { ConfigMap } from '@/components/kubernetes/quick-view-resources/ConfigMapList';
import { DefaultService } from "@/gingerJs_api_client";

export default function ConfigMapsPage() {
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    resource: configMaps,
    isLoading: loading,
    error,
    refetch
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "configmaps" });

  const handleCreateConfigMap = async (data: ConfigMapFormData) => {
    function arrayToObject(arr: { key: string, value: string }[]) {
      return arr.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }
    try {
      // Transform arrays to objects for backend
      const payload = {
        ...data,
        data: arrayToObject(data.data),
        binaryData: arrayToObject(data.binaryData),
        metadata: {
          ...data.metadata,
          labels: arrayToObject(data.metadata.labels),
          annotations: arrayToObject(data.metadata.annotations),
        }
      };
      const response = await DefaultService.apiKubernertesResourcesTypeCreatePost({
        requestBody: payload,
        type: "configmaps"
      });
      console.log(response);
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      console.error("Error creating ConfigMap:", error);
      throw error;
    }
  };

  const handleDelete = async (configMap: ConfigMap) => {
    try {
      await DefaultService.apiKubernertesResourcesTypeDelete({
        type: "configmaps",
        apiVersion: configMap.apiVersion as string,
        name: configMap?.metadata?.name as string,
        namespace: configMap?.metadata?.namespace as string,
      });

      refetch();
      toast.success(
        `ConfigMap ${configMap?.metadata?.name} deleted successfully`
      );
    } catch (err) {
      toast.error(`Failed to delete config map ${configMap?.metadata?.name}`);
    }
  };

  if (error) {
    return <div>Error loading ConfigMaps: {error}</div>;
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <ContainerIcon className="h-4 w-4" />
              <h2>ConfigMaps</h2>
            </div>
          }
          shortDescription="View and manage Kubernetes ConfigMaps—store and manage non-confidential configuration data."
          description="ConfigMaps are used to store non-confidential configuration data in key-value pairs. They can be consumed by pods as environment variables, command-line arguments, or as configuration files in a volume. ConfigMaps are useful for storing configuration data that can be updated without rebuilding container images."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your ConfigMaps</CardTitle>
              <CardDescription>
                {configMaps?.length || 0} ConfigMaps found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button onClick={() => setShowCreateDialog(true)}>
                <ContainerIcon className="w-4 h-4 mr-2" />
                Create ConfigMap
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            ) : (
              <ConfigMapList
                configMaps={configMaps || []}
                onEdit={async (configMap: ConfigMap) => {
                  console.log("Edit config map:", configMap);
                }}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <ContainerIcon className="h-5 w-5" />
              ConfigMap Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <ConfigMapForm
              onSubmit={handleCreateConfigMap}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
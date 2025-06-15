import React, { useContext, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ConfigMap, ConfigMapTable } from '@/components/kubernetes/ConfigMapTable'
import { toast } from "sonner"
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'
import { DefaultService } from '@/gingerJs_api_client'
import RouteDescription from '@/components/route-description'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, ShieldIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfigMapList } from '@/components/kubernetes/quick-view-resources/ConfigMapList'

export default function ConfigMapsPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");
  const {
    resource: configMaps,
    isLoading,
    error,
    refetch
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "configmaps" })

  const filteredConfigMaps =
  configMaps?.filter(
      (deployment) =>
        deployment.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  const handleDelete = async (configMap: ConfigMap) => {
    try {
      await DefaultService.apiKubernertesResourcesTypeDelete({
        type: "configmap",
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

  const handleEdit = async(configMap: ConfigMap) => {
    // Implement edit functionality
    console.log("Edit config map:", configMap);
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              <h2>Config Maps</h2>
            </div>
          }
          shortDescription="Manage your Kubernetes ConfigMaps—create, view, edit, and delete configuration data for your applications in one place."
          description="Kubernetes ConfigMaps allow you to decouple configuration data from application code. They store key-value pairs that can be consumed by Pods as environment variables or mounted as files. This makes it easy to manage and update configurations without rebuilding your containers. ConfigMaps are ideal for handling non-sensitive configuration settings in your cluster."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your ConfigMaps</CardTitle>
              <CardDescription>
                ConfigMaps from {selectedNamespace || "All"} namespace
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button>Create ConfigMap</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search configMaps..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ConfigMapList
              configMaps={filteredConfigMaps}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
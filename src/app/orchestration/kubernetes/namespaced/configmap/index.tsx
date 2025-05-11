import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"
import {ConfigMap, ConfigMapTable} from '@/components/kubernetes/ConfigMapTable'
import { toast } from "sonner"
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'
import { DefaultService } from '@/gingerJs_api_client'

export default function ConfigMapsPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:configMaps,
    isLoading,
    error,
    refetch
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"configmaps"})

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

  const handleEdit = (configMap: ConfigMap) => {
    // Implement edit functionality
    console.log("Edit config map:", configMap);
  };

  if (isLoading) return <div>Loading...</div>

  return (
    <div className='w-full'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Config Maps</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Config Map</Button>
        </div>
      </div>
      <ConfigMapTable
        configMaps={configMaps as ConfigMap[]}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
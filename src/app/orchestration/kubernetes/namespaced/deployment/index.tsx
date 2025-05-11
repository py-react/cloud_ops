import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { DeploymentList } from '@/components/kubernetes/DeploymentList'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function ServicesPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:deployments,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"deployments"})


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deployment</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Deployment</Button>
        </div>
      </div>
      {!isLoading ? (
        <DeploymentList deployments={deployments} />
      ):<div>Loading...</div>}
    </div>
  )
}


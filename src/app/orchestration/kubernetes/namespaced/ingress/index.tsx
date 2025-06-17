import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"

import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import KubernetesIngressList from '@/components/kubernetes/Ingress'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function IngressPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:ingress,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"ingress"})


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
        <h1 className="text-2xl font-bold">Ingress</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Ingress</Button>
        </div>
      </div>
      {!isLoading ? (
        <KubernetesIngressList ingressList={ingress} />
      ):<div>Loading...</div>}
    </div>
  )
}


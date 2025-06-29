import React, { useContext } from 'react'
import { Button } from "@/components/ui/button"

import KubernetesIssuerList, { IssuerType } from '@/components/kubernetes/issuer'
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function IngressPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:issuer,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"issuer"})


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
        <h1 className="text-2xl font-bold">Issuer</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Issuer</Button>
        </div>
      </div>
      {!isLoading ? (
        <KubernetesIssuerList items={issuer as IssuerType[]} />
      ):<div>Loading...</div>}
    </div>
  )
}


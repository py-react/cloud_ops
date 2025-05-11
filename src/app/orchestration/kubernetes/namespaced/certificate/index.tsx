import React, { useContext } from 'react'
import { Button } from "@/components/ui/button"

import KubernetesCertificateList from '@/components/kubernetes/certificates'
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function IngressPage() {
  const {selectedNamespace} = useContext(NamespaceContext)

  const {
    resource:certificates,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"certificate"})


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
        <h1 className="text-2xl font-bold">Certificate</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Certificate</Button>
        </div>
      </div>
      {!isLoading ? (
        <KubernetesCertificateList items={certificates as []} />
      ):<div>Loading...</div>}
    </div>
  )
}


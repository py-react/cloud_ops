

import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import KubernetesSecretList, { SecretType } from '@/components/kubernetes/secrets'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'

interface Secret {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
  };
  type: string;
  data: Record<string, string>;
}

export default function SecretsPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:secrets,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"secrets"})


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
        <h1 className="text-2xl font-bold">Secrets</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Secret</Button>
        </div>
      </div>
      {!isLoading ? (
        <div className="space-y-4">
          <KubernetesSecretList  items={secrets as SecretType[]}/>
        </div>
      ):<div>Loading...</div>}
    </div>
  )
}
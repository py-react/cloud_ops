import React, { useContext } from 'react'
import { Button } from "@/components/ui/button"
import PageLayout from "@/components/PageLayout";
import { Shield } from "lucide-react";

import KubernetesIssuerList, { IssuerType } from '@/components/kubernetes/issuer'
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function IngressPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const {
    resource: issuer,
    isLoading,
    error
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "issuer" })


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Issuer"
      subtitle="Manage your Kubernetes Issuers."
      icon={Shield}
      actions={
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Issuer</Button>
        </div>
      }
    >
      {!isLoading ? (
        <KubernetesIssuerList items={issuer as IssuerType[]} />
      ) : <div>Loading...</div>}
    </PageLayout>
  )
}


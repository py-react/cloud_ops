import React, { useContext } from 'react'
import { Button } from "@/components/ui/button"
import PageLayout from "@/components/PageLayout";
import { Shield } from "lucide-react";

import KubernetesCertificateList from '@/components/kubernetes/certificates'
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function IngressPage() {
  const { selectedNamespace } = useContext(NamespaceContext)

  const {
    resource: certificates,
    isLoading,
    error
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "certificate" })


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Certificate"
      subtitle="Manage your Kubernetes Certificates."
      icon={Shield}
      actions={
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Certificate</Button>
        </div>
      }
    >
      {!isLoading ? (
        <KubernetesCertificateList items={certificates as []} />
      ) : <div>Loading...</div>}
    </PageLayout>
  )
}


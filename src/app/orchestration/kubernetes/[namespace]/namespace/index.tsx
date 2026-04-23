import React, { useState, useContext } from 'react'
import { Button } from "@/components/ui/button"
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import CreateNamespaceModal from '@/components/kubernetes/CreateNamesapceModal'
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { toast } from "sonner"
import { DefaultService } from '@/gingerJs_api_client'
import PageLayout from "@/components/PageLayout"
import { Share2Icon, Plus } from "lucide-react"

export default function NamespacesPage() {
  const { isLoading, namespaces, fetchNamespaces } = useContext(NamespaceContext)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Status", accessor: "status" },
    { header: "Created At", accessor: "createdAt" },
  ]

  const transformedNamespaces = namespaces?.map((ns: any) => ({
    name: ns.metadata?.name || "",
    status: ns.status?.phase || "Unknown",
    createdAt: ns.metadata?.creationTimestamp
      ? new Date(ns.metadata.creationTimestamp).toLocaleDateString()
      : "Unknown",
    fullData: ns,
    showEdit: true,
    showDelete: true,
  })) || []

  const handleDelete = async (namespace: any) => {
    try {
      await DefaultService.apiKubernertesClusterNamespaceDelete({
        name: namespace.name,
      })
      fetchNamespaces()
      toast.success(`Namespace ${namespace.name} deleted successfully`)
    } catch (err) {
      toast.error(`Failed to delete namespace ${namespace.name}`)
    }
  }

  const handleEdit = (namespace: any) => {
    // Implement edit functionality
    console.log('Edit namespace:', namespace)
  }

  const handleCreate = async (newNamespace: any) => {
    try {
      await DefaultService.apiKubernertesClusterNamespacePost({
        requestBody: {
          name: newNamespace.metadata.name,
        },
      });
      setIsCreateModalOpen(false)
      fetchNamespaces()
      toast.success(`Namespace ${newNamespace.metadata.name} created successfully`)
    } catch (err) {
      toast.error(`Failed to create namespace ${newNamespace.metadata.name}`)
    }
  }

  return (
    <PageLayout
      title="Namespaces"
      subtitle="View and manage Kubernetes namespaces in your cluster."
      icon={Share2Icon}
    >
      <ResourceTable
        title="All Namespaces"
        description="List of all available namespaces in the current cluster context."
        icon={<Share2Icon className="w-5 h-5 text-primary" />}
        columns={columns}
        data={transformedNamespaces}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        extraHeaderContent={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Namespace
          </Button>
        }
      />
      <CreateNamespaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </PageLayout>
  )
}

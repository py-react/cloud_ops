import React,{ useState,useContext } from 'react'
import { Button } from "@/components/ui/button"
import ResourceTable from '@/components/kubernetes/ResourceTable'
import CreateNamespaceModal from '@/components/kubernetes/CreateNamesapceModal'
// import { CoreV1Service } from '@/kube/services/CoreV1Service'
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { toast } from "sonner"
import { DefaultService } from '@/gingerJs_api_client'


export default function ServicesPage() {
  const {isLoading,namespaces,fetchNamespaces} = useContext(NamespaceContext)
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)


  const handleDelete = async (namespace) => {
    try {
      await DefaultService.apiKubernertesClusterNamespaceDelete({
        name: newNamespace.metadata.name,
      })
      fetchNamespaces()
      toast.success(`Service ${namespace.metadata.name} deleted successfully`)
    } catch (err) {
      toast.error(`Failed to delete service ${namespace.metadata.name}`)
    }
  }

  const handleEdit = (service) => {
    // Implement edit functionality
    console.log('Edit service:', service)
  }
  const handleCreate = async (newNamespace) => {
    try {
      await DefaultService.apiKubernertesClusterNamespacePost({
        requestBody: {
          name: newNamespace.metadata.name,
        },
      });
      setIsCreateModalOpen(false)
      toast.success(`Namespace ${newNamespace.metadata.name} created successfully`)
    } catch (err) {
      toast.error(`Failed to create namespace ${newNamespace.metadata.name}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Namespaces</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Namespace</Button>
      </div>
      {!isLoading ? (
        <ResourceTable
          resources={namespaces}
          columns={[
            { key: 'metadata.name', header: 'Name' },
            { key: 'status.phase', header: 'Status' },
            { key: 'metadata.creationTimestamp', header: 'Created At' },
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ):<div>Loading...</div>}
      <CreateNamespaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}


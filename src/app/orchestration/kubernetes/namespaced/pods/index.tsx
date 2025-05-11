import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Pod, PodTable } from '@/components/kubernetes/PodTable'
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'

export default function PodsPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:pods,
    isLoading,
    error,
    refetch
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"pods"})


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }


  const handleEdit = (pod:Pod) => {
    // Implement edit functionality
    console.log('Edit pod:', pod)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className='w-full'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pods</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Pod</Button>
        </div>
      </div>
      <PodTable
        pods={pods as Pod[]}
        onEdit={handleEdit}
        onDelete={()=>{}}
      />
    </div>
  )
}
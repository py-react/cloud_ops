import React,{ useContext } from 'react'
import { Button } from "@/components/ui/button"
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
import { ServiceList } from '@/components/kubernetes/SerivceList'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'


export default function ServicesPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const {
    resource:services,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"services"})

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
        <h1 className="text-2xl font-bold">Services</h1>
        <div className="flex gap-2 items-center">
          <NamespaceSelector />
          <Button>Create Service</Button>
        </div>
      </div>
      {!isLoading ?(
        <ServiceList  services={services}/>
      ):<div>Loading...</div>}
    </div>
  )
}


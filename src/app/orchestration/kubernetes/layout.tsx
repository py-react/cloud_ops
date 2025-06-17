import React from 'react'
import { Outlet } from 'react-router-dom'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'

function KubernetesLayout() {
    
  return (
    <div key="KubernetesLayout" className="w-full p-4">
        <KubeContextProvider>
            <NamespaceContextProvider>
                <Outlet /> 
            </NamespaceContextProvider>
        </KubeContextProvider>
    </div>
  )
}

export default KubernetesLayout
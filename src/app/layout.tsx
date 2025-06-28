import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'

function AppLayout() {
  return (
    <div key="AppLayout" className='p-0 w-full'>
      <SidebarProvider>
      <KubeContextProvider>
        <NamespaceContextProvider>
            <AppSidebar />
            <Outlet />
        </NamespaceContextProvider>
        </KubeContextProvider>
      </SidebarProvider>
      <Toaster />
    </div>
  )
}

export default AppLayout
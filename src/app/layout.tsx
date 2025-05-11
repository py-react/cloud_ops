import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

function AppLayout() {
  return (
    <div key="AppLayout" className='p-0 w-full'>
      <SidebarProvider>
        <AppSidebar />
        <Outlet />
      </SidebarProvider>
      <Toaster />
    </div>
  )
}

export default AppLayout
import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { CommandCenter } from '@/components/CommandCenter'
import { ClippyOverlay } from '@/components/ClippyOverlay'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NavigationHistoryProvider } from '@/libs/navigationHistory'
import { NotificationProvider } from '@/components/NotificationProvider'


function AppLayout() {
  return (
    <NavigationHistoryProvider>
      <NotificationProvider>
        <div key="AppLayout" className='p-0 w-full min-h-screen bg-background'>
        <SidebarProvider>
          <KubeContextProvider>
            <NamespaceContextProvider>
              <AppSidebar />
              <CommandCenter />
              <ClippyOverlay />
              <main className='w-full overflow-auto'>
                <Outlet />
              </main>
            </NamespaceContextProvider>
          </KubeContextProvider>
        </SidebarProvider>
        <Toaster richColors position="bottom-right" />
      </div>
      </NotificationProvider>
    </NavigationHistoryProvider>
  )
}

export default AppLayout
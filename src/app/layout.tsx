import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { CommandCenter } from '@/components/CommandCenter'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NavigationHistoryProvider } from '@/libs/navigationHistory'


function AppLayout() {
  useEffect(() => {
    const mysocket = new WebSocket("ws://127.0.0.1:5001/ws/test");
    mysocket.onmessage = function (event) {
      console.log(event.data)
    };
    mysocket.onopen = function (event) {
      mysocket.send("Hello, world!")
    }
    // return ()=>{
    //   mysocket.close()
    // }
  }, [])

  return (
    <NavigationHistoryProvider>
      <div key="AppLayout" className='p-0 w-full min-h-screen bg-background'>
        <SidebarProvider>
          <KubeContextProvider>
            <NamespaceContextProvider>
              <AppSidebar />
              <CommandCenter />
              <main className='w-full overflow-auto'>
                <Outlet />
              </main>
            </NamespaceContextProvider>
          </KubeContextProvider>
        </SidebarProvider>
        <Toaster richColors position="bottom-right" />
      </div>
    </NavigationHistoryProvider>
  )
}

export default AppLayout
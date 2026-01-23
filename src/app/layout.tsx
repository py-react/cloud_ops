import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NavigationHistoryProvider } from '@/libs/navigationHistory'
import BackButton from '@/components/BackButton'

function AppLayout() {
  useEffect(()=>{
    const mysocket = new WebSocket("ws://127.0.0.1:5001/ws/test");
    mysocket.onmessage = function(event) {
        console.log(event.data)
    };
    mysocket.onopen = function(event) {
        mysocket.send("Hello, world!")
    }
    // return ()=>{
    //   mysocket.close()
    // }
  },[])
  
  return (
    <NavigationHistoryProvider>
      <div key="AppLayout" className='p-0 w-full'>
        <SidebarProvider>
        <KubeContextProvider>
          <NamespaceContextProvider>
              <AppSidebar />
              <div className='w-full p-4'>
                <BackButton />
                <Outlet />
              </div>
          </NamespaceContextProvider>
          </KubeContextProvider>
        </SidebarProvider>
        <Toaster />
      </div>
    </NavigationHistoryProvider>
  )
}

export default AppLayout
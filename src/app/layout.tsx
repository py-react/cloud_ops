import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { CommandCenter } from '@/components/CommandCenter'
import { ClippyOverlay } from '@/components/ClippyOverlay'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NavigationHistoryProvider } from '@/libs/navigationHistory'
import { NotificationProvider } from '@/components/NotificationProvider'
import { GCPContextProvider } from '@/components/gcp/contextProvider/GCPContext'
import { AWSContextProvider } from '@/components/aws/contextProvider/AWSContext'
import { DefaultService } from "@/gingerJs_api_client";

const redirectToLogin = () => {
  document.cookie = "k1w1_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/login'
}

const redirectToOnboarding = () => {
  window.location.href = '/onboarding'
}

function AppLayout() {
  const location = useLocation()
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true)

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      }

      const token = getCookie('k1w1_token')

      if (location.pathname === '/login' || location.pathname === '/onboarding') {
        setCheckingOnboarding(false)
        return
      }
      if (!token) {
        redirectToLogin()
        return
      }

      try {
        const data: any = await DefaultService.apiSystemOnboardingGet()
        if (data.onboarding_required) {
          redirectToOnboarding()
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        redirectToLogin()
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkAuthAndOnboarding()
  }, [location.pathname])

  if (checkingOnboarding) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  const hideFrame = ['/login', '/onboarding'].includes(location.pathname)

  return (
    <NavigationHistoryProvider>
      <NotificationProvider>
        <div key="AppLayout" className='p-0 w-full min-h-screen bg-background'>
        <GCPContextProvider>
        <AWSContextProvider>
        <SidebarProvider>
          {!hideFrame && <KubeContextProvider>
            <NamespaceContextProvider>
              <AppSidebar />
              <CommandCenter />
              <ClippyOverlay />
              <main className='w-full overflow-auto'>
                <Outlet />
              </main>
            </NamespaceContextProvider>
          </KubeContextProvider>}
          {hideFrame && <main className='w-full overflow-auto'>
            <Outlet />
          </main>}
        </SidebarProvider>
        </AWSContextProvider>
        </GCPContextProvider>
        <Toaster richColors position="bottom-right" />
      </div>
      </NotificationProvider>
    </NavigationHistoryProvider>
  )
}

export default AppLayout
import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
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


function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true)
  const isPublicPage = location.pathname === '/login'

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      }

      const token = getCookie('k1w1_token')

      if (isPublicPage) {
        setCheckingOnboarding(false)
        return
      }
      if (!token) {
        navigate('/login')
        setCheckingOnboarding(false)
        return
      }

      try {
        const res = await fetch('/api/system/onboarding', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (res.status === 401) {
          navigate('/login')
          setCheckingOnboarding(false)
          return
        }

        const data = await res.json()
        if (data.onboarding_required && location.pathname !== '/onboarding') {
          navigate('/onboarding')
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        navigate('/login')
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkAuthAndOnboarding()
  }, [location.pathname, navigate, isPublicPage])

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
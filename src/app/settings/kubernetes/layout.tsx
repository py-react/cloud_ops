import React from 'react'
import { Outlet } from 'react-router-dom'
import { KubeContextProvider } from '@/components/kubernetes/context/KubeContext'
import { NamespaceContextProvider } from '@/components/kubernetes/context/NamespaceContext'

export const Layout = () => {
  return (
    <div key="SettingsKubernetesLayout" className="w-full p-4">
      <KubeContextProvider>
        <NamespaceContextProvider>
          <Outlet />
        </NamespaceContextProvider>
      </KubeContextProvider>
    </div>
  );
}

export default Layout
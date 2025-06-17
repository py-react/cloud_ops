import React from 'react'
import { Outlet } from 'react-router-dom'
import { KubeContextProvider } from '@/components/kubernetes/contextProvider/KubeContext'
import { NamespaceContextProvider } from '@/components/kubernetes/contextProvider/NamespaceContext'
import BackButton from '@/components/BackButton'

export const Layout = () => {
  return (
    <div key="SettingsKubernetesLayout" className="w-full p-4">
      <KubeContextProvider>
        <NamespaceContextProvider>
          <BackButton />
          <Outlet />
        </NamespaceContextProvider>
      </KubeContextProvider>
    </div>
  );
}

export default Layout
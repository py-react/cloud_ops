import React from 'react'
import { Outlet } from 'react-router-dom'
import BackButton from '@/components/BackButton'

export const Layout = () => {
  return (
    <div key="SettingsKubernetesLayout" className="w-full p-4">
      <BackButton />
      <Outlet />
    </div>
  );
}

export default Layout
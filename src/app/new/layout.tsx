import React from 'react'
import { Outlet } from 'react-router-dom'
import { DockerEngineContextProvider } from '@/components/docker/contextProvider/DockerEngineContext'

function V2Layout() {
  return (
    <DockerEngineContextProvider>
      <Outlet />
    </DockerEngineContextProvider>
  )
}

export default V2Layout

import React from 'react'
import { Outlet } from 'react-router-dom'

function DockerLayout() {
  return (
    <div className="w-full p-4" key="DockerLayout">
      <Outlet />
    </div>
  )
}

export default DockerLayout
import React from 'react'
import { Outlet } from 'react-router-dom'

function DockerLayout() {
  return (
    <div className='w-full' key="DockerLayout">
      <Outlet />
    </div>
  )
}

export default DockerLayout
import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

function DockerContainerLayout() {

  return (
    <div className="w-full" key="DockerContainerLayout" >
      <Outlet />
    </div>
  )
}

export default DockerContainerLayout
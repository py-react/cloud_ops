import React from 'react'
import { Outlet } from 'react-router-dom'

function OrchestrationLayout() {
  return (
    <div key="OrchestrationLayout" className="w-full">
      <Outlet /> 
    </div>
  )
}

export default OrchestrationLayout
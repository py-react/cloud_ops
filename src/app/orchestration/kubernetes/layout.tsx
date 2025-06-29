import React from 'react'
import { Outlet } from 'react-router-dom'

function KubernetesLayout() {
    
  return (
    <div key="KubernetesLayout" className="w-full p-4">
      <Outlet /> 
    </div>
  )
}

export default KubernetesLayout
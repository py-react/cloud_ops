import React from 'react'
import { Outlet } from 'react-router-dom'

function KubernetesNamespacedLayout() {
    
  return (
    <div key="KubernetesNamespacedLayout">
      <Outlet /> 
    </div>
  )
}

export default KubernetesNamespacedLayout
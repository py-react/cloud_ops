import BackButton from '@/components/BackButton'
import React from 'react'
import { Outlet } from 'react-router-dom'

function KubernetesNamespacedLayout() {
    
  return (
    <div key="KubernetesNamespacedLayout">
      <BackButton />
      <Outlet /> 
    </div>
  )
}

export default KubernetesNamespacedLayout
import { InfraContextProvider } from '@/components/kubernetes/infra/context/InfraContext'
import InfraSideNav from '@/components/kubernetes/infra/InfraSideNav'
import React,{useState} from 'react'
import { Outlet } from 'react-router-dom'

function InfraLayout() {
   

  return (
    <div className='w-full flex items-start'>
        <InfraContextProvider>
            <InfraSideNav />
            <div className="w-full">
                <Outlet />
            </div>
        </InfraContextProvider>
    </div>
  )
}

export default InfraLayout
import React, { useEffect } from 'react'
import useNavigate from '@/libs/navigate'

function Infra() {
    const navigate = useNavigate()

    useEffect(()=>{
        navigate("/infra/manager")
    },[])

  return (
    null
  )
}

export default Infra
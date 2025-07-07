import React, { useEffect } from 'react'
import useNavigate from '@/libs/navigate'

function Infra() {
    const navigate = useNavigate()

    useEffect(()=>{
        navigate("/cee/docker")
    },[])

  return (
    null
  )
}

export default Infra
import useNavigate from "@/libs/navigate"
import React, { useEffect } from "react"
import { useParams } from "react-router-dom"



const Page = ()=>{
    const {repo_id} = useParams()
    const navigate = useNavigate()

    useEffect(()=>{
        if(!repo_id){
            navigate("/settings/ci_cd")
        }
    },[])
    return <>redireting...</>
}

export default Page
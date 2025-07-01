import useNavigate from "@/libs/navigate"
import React, { useEffect } from "react"
import { useParams } from "react-router-dom"



const Page = ()=>{
    const {repo_name} = useParams()
    const navigate = useNavigate()

    useEffect(()=>{
        if(!repo_name){
            navigate("/settings/ci_cd")
        }
    },[])
    return <>hello</>
}

export default Page
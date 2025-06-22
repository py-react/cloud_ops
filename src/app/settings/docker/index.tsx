import useNavigate from "@/libs/navigate"
import { useEffect } from "react"

function Kubernetes() {
  const navigate = useNavigate()
  useEffect(()=>{
    navigate("/settings/docker/registry")
  },[])
  return "redirecting..."
}

export default Kubernetes
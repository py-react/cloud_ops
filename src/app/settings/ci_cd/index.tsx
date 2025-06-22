import useNavigate from "@/libs/navigate"
import { useEffect } from "react"

function Kubernetes() {
  const navigate = useNavigate()
  useEffect(()=>{
    navigate("/settings/ci_cd/source_control_settings")
  },[])
  return "redirecting..."
}

export default Kubernetes
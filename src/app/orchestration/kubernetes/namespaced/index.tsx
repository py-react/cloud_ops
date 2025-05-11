import useNavigate from "@/libs/navigate"
import { useEffect } from "react"

function Namespaced() {
  const navigate = useNavigate()
  useEffect(()=>{
    navigate("/orchestration/kubernetes/namespaced/deployment")
  },[])
  return "redirecting..."
}

export default Namespaced


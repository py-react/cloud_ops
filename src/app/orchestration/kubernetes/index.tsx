import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext"
import useNavigate from "@/libs/navigate"
import { useContext, useEffect } from "react"

function Namespaced() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const navigate = useNavigate()
  useEffect(()=>{
    navigate(`/orchestration/kubernetes/${selectedNamespace}`)
  },[])
  return "redirecting..."
}

export default Namespaced
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext"
import useNavigate from "@/libs/navigate"
import React, { useContext, useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Namespaced() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/orchestration/kubernetes/${selectedNamespace}`)
  }, [])
  return (
    <RedirectPage />
  );
}

export default Namespaced
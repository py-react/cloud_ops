import useNavigate from "@/libs/navigate"
import React, { useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Kubernetes() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate("/settings/kubernetes/contexts")
  }, [])
  return (
    <RedirectPage />
  );
}

export default Kubernetes
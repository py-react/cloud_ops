import useNavigate from "@/libs/navigate"
import React, { useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Kubernetes() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate("/settings/gcp/compute")
  }, [])
  return (
    <RedirectPage />
  );
}

export default Kubernetes
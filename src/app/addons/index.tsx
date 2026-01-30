import useNavigate from "@/libs/navigate"
import React, { useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Namespaced() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/addons/monitoring`)
  }, [])
  return (
    <RedirectPage />
  );
}

export default Namespaced
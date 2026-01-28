import React, { useContext, useEffect } from "react";
import useNavigate from "@/libs/navigate";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import RedirectPage from "@/components/RedirectPage";

export default function DeploymentsPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext)

  useEffect(() => {
    navigate(`/orchestration/kubernetes/${selectedNamespace}/deployments/deployments`)
  }, [])
  return (
    <RedirectPage />
  );
}



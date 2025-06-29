import React, { useEffect } from "react";

import useNavigate from "@/libs/navigate";

export  default function DeploymentsPage() {
  const navigate = useNavigate()
  useEffect(()=>{
    navigate("/orchestration/kubernetes/namespaced/deployments/deployments")
  },[])
  return "redirecting..."
}



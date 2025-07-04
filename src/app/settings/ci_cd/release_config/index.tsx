import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import useNavigate from "@/libs/navigate";
import React, {  useContext, useEffect } from "react";

const ReleaseConfigPage = () => {
  const {selectedNamespace} = useContext(NamespaceContext)
  const navigate = useNavigate()

  useEffect(()=>{
    navigate(`/settings/ci_cd/release_config/${selectedNamespace}`)
  },[])

  return (
   <>redirecting...</>
  );
};

export default ReleaseConfigPage;

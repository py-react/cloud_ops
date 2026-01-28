import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import useNavigate from "@/libs/navigate";
import React, { useContext, useEffect } from "react";
import RedirectPage from "@/components/RedirectPage";

const ReleaseConfigPage = () => {
  const { selectedNamespace } = useContext(NamespaceContext)
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/settings/ci_cd/release_config/${selectedNamespace}`)
  }, [])

  return (
    <RedirectPage />
  );
};

export default ReleaseConfigPage;

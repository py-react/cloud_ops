import React, { useContext, useEffect } from "react";
import useNavigate from "@/libs/navigate";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import RedirectPage from "@/components/RedirectPage";

function Kubernetes() {
    const navigate = useNavigate()
    const { selectedNamespace } = useContext(NamespaceContext)
    useEffect(() => {
        navigate(`/settings/ci_cd/library/${selectedNamespace}/spec/container`)
    }, [])
    return (
        <RedirectPage />
    );
}

export default Kubernetes
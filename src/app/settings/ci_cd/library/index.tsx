import React, { useContext, useEffect } from "react";
import useNavigate from "@/libs/navigate";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import RedirectPage from "@/components/RedirectPage";

const LibraryPage = () => {
    const { selectedNamespace } = useContext(NamespaceContext)
    const navigate = useNavigate()

    useEffect(() => {
        navigate(`/settings/ci_cd/library/${selectedNamespace}/spec/container`)
    }, [])

    return (
        <RedirectPage />
    );
};

export default LibraryPage;
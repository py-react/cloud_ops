import useNavigate from "@/libs/navigate"
import React, { useContext, useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Namespaced() {
    const navigate = useNavigate()
    useEffect(() => {
        navigate(`/infra/gcp/storage`)
    }, [])
    return (
        <RedirectPage />
    );
}

export default Namespaced
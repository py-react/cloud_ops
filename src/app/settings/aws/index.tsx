import useNavigate from "@/libs/navigate"
import React, { useContext, useEffect } from "react"
import RedirectPage from "@/components/RedirectPage";

function Namespaced() {
    const navigate = useNavigate()
    useEffect(() => {
        navigate(`/settings/aws/compute`)
    }, [])
    return (
        <RedirectPage />
    );
}

export default Namespaced

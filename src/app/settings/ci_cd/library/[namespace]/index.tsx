import useNavigate from "@/libs/navigate"
import { useEffect, useContext } from "react"
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'

function Kubernetes() {
    const navigate = useNavigate()
    const { selectedNamespace } = useContext(NamespaceContext)
    useEffect(() => {
        navigate(`/settings/ci_cd/library/${selectedNamespace}/spec/container`)
    }, [])
    return "redirecting..."
}

export default Kubernetes
import useNavigate from "@/libs/navigate"
import { useEffect } from "react"

function Docker() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate("/settings/docker/config")
  }, [])
  return "redirecting..."
}

export default Docker
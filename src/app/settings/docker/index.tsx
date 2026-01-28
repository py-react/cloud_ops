import useNavigate from "@/libs/navigate";
import React, { useEffect } from "react";
import RedirectPage from "@/components/RedirectPage";

const DockerPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/settings/docker/config`)
  }, [])

  return (
    <RedirectPage />
  );
};

export default DockerPage;
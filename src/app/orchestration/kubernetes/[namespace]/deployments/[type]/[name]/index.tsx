import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import DeploymentDetailedInfo from "@/components/kubernetes/quick-view-resources/details/deployment";
import { DefaultService } from "@/gingerJs_api_client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export default function DeploymentDetailPage() {
  const { type, name } = useParams();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [isFetching, setIsFetching] = useState(true);
  const [data, setData] = useState(null);
  const fetchData = async () => {
    const response = await DefaultService.apiKubernertesDeploymentsGet({
      namespace: selectedNamespace,
      deploymentName: name,
      resourceType: type,
    }).catch((err) => {
      toast.error(err.message);
    });
    if(!response) return
    if (response.error) {
      toast.error(response.message);
      return;
    }
    setData(response);
    return;
  };

  useEffect(() => {
    if (selectedNamespace) {
      (async () => {
        setIsFetching(true);
        await fetchData();
        setIsFetching(false);
      })();
    }
  }, [ selectedNamespace]);

  return <DeploymentDetailedInfo kubernetesData={data} />;
}

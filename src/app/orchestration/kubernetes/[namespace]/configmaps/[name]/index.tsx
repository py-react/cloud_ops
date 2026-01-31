import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { ConfigDetailedInfo } from "@/components/kubernetes/quick-view-resources/details/configmap"
import { DefaultService } from "@/gingerJs_api_client";
import React, { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { toast } from "sonner";


import PageLayout from "@/components/PageLayout";
import { ContainerIcon } from "lucide-react";

export default function DeploymentDetailPage() {
  const { name } = useParams();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    const response = await DefaultService.apiKubernertesConfigmapsGet({
      namespace: selectedNamespace,
      configmapName: name,
    }).catch((err: any) => {
      toast.error(err.message);
    });
    if (!response) return
    if (response.error) {
      setError(response.message)
      toast.error(response.message);
      return;
    }
    setData(response);
    return;
  };

  useEffect(() => {
    if (selectedNamespace) {
      (async () => {
        setIsLoading(true)
        await fetchData();
        setIsLoading(false)
      })();
    }
  }, [selectedNamespace]);

  return (
    <PageLayout
      title={name || "ConfigMap Details"}
      subtitle="View configuration data details."
      icon={ContainerIcon}
    >
      <ConfigDetailedInfo error={error} data={data} loading={isLoading} />
    </PageLayout>
  )
}
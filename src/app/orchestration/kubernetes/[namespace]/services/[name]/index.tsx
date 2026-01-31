import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { ServiceDetailedInfo } from "@/components/kubernetes/quick-view-resources/details/service";
import { DefaultService } from "@/gingerJs_api_client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import PageLayout from "@/components/PageLayout";
import { NetworkIcon } from "lucide-react";

export default function DeploymentDetailPage() {
  const { name } = useParams();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    const response = await DefaultService.apiKubernertesServiceGet({
      namespace: selectedNamespace,
      serviceName: name,
    }).catch((err: any) => {
      toast.error(err.message);
    });
    if (!response) return;
    if (response.error) {
      setError(response.message);
      toast.error(response.message);
      return;
    }
    setData(response);
    return;
  };

  useEffect(() => {
    if (selectedNamespace) {
      (async () => {
        setIsLoading(true);
        await fetchData();
        setIsLoading(false);
      })();
    }
  }, [selectedNamespace]);

  return (
    <PageLayout
      title={name || "Service Details"}
      subtitle="View detailed configuration and status for this Service."
      icon={NetworkIcon}
    >
      <ServiceDetailedInfo error={error} data={data} loading={isLoading} />
    </PageLayout>
  );
}

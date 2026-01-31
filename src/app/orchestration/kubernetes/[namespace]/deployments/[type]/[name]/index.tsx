import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import DeploymentDetailedInfo from "@/components/kubernetes/quick-view-resources/details/deployment";
import { DefaultService } from "@/gingerJs_api_client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import PageLayout from "@/components/PageLayout";
import { RocketIcon } from "lucide-react";

export default function DeploymentDetailPage() {
  const { type, name } = useParams();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [data, setData] = useState<any>(null);
  const fetchData = async () => {
    const response = await DefaultService.apiKubernertesDeploymentsGet({
      namespace: selectedNamespace,
      deploymentName: name,
      resourceType: type,
    }).catch((err: any) => {
      toast.error(err.message);
    });
    if (!response) return
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
        await fetchData();
      })();
    }
  }, [selectedNamespace]);

  return (
    <PageLayout
      title={name || "Deployment Details"}
      subtitle={`View details for this ${type || "deployment"}.`}
      icon={RocketIcon}
    >
      <DeploymentDetailedInfo kubernetesData={data} />
    </PageLayout>
  );
}

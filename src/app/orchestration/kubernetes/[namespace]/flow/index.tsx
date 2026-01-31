import React, { useContext, useEffect, useState } from "react";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
// import { ResourceFlow } from "@/components/kubernetes/DeploymentOverview";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import CanvasViewer from "@/components/kubernetes/erd/canvas";
import PageLayout from "@/components/PageLayout";
import { Share2Icon } from "lucide-react";
import React_Flow from "@/components/kubernetes/react-flow/flow";

function DeploymentOverview() {
  const { isLoading: isNamespaceLoading, selectedNamespace } =
    useContext(NamespaceContext);
  const [isLoading, setIsLoading] = useState(true);
  const [deployments, setDeployemnts] = useState({});
  // const [selectedDeployment, setSelectedDeployment] = useState<string>(
  //   Object.keys(deployments).length ? Object.keys(deployments)[0] : ""
  // );

  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (!isNamespaceLoading && selectedNamespace) fetchDeployment();
  }, [selectedNamespace, isNamespaceLoading]);

  const fetchDeployment = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiKubernertesFlowV2Get({
        namespace: selectedNamespace,
      });
      setDeployemnts(response);
      // setSelectedDeployment(Object.keys(response.items));
    } catch (err) {
      console.log(err, "fineme");
      toast.error(`Failed to fetch services ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      title="Cluster Flow"
      subtitle="Visual representation of your cluster resources and their relationships."
      icon={Share2Icon}
      actions={<NamespaceSelector />}
    >
      {!isLoading ? (
        <div className="w-full h-[calc(100vh-200px)]">
          <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <React_Flow
              data={deployments}
            />
          </React.Suspense>
        </div>
      ) : null}
    </PageLayout>
  );
}

export default DeploymentOverview;

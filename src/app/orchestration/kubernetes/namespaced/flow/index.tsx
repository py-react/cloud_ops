import React, { useContext, useEffect, useState } from "react";
import { NamespaceContext } from "@/components/kubernetes/context/NamespaceContext";
// import { ResourceFlow } from "@/components/kubernetes/DeploymentOverview";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import CanvasViewer from "@/components/kubernetes/erd/canvas";
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
    <>
      <>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Deployment Overview</h1>
          <div className="flex gap-2 items-center">
            <NamespaceSelector />
            {/* {!isLoading && selectedDeployment ? (
                <div className="relative w-64">
                  <select
                    value={selectedDeployment}
                    onChange={(e) => setSelectedDeployment(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Object.keys(deployments).map((deploymentKey) => (
                      <option key={deploymentKey} value={deploymentKey}>
                        {deployments[deploymentKey].deployment_name}
                      </option>
                    ))}
                  </select>
                </div>
              ):null} */}
          </div>
        </div>
      </>
      {!isLoading ? (
        <div className="w-full">
          <React.Suspense fallback="Loading...">
            <React_Flow
              data={deployments}
            />
          </React.Suspense>
        </div>
      ) : 
      null}
    </>
  );
}

export default DeploymentOverview;

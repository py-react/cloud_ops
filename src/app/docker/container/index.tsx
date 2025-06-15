import React, { useState } from "react";
import { ContainerDetails } from "@/components/containers/ContainerDetails";
import { useContainerDetails } from "@/components/containers/hooks/useContainerDetails";
import { ContainerList } from "@/components/containers/ContainerList";
import { Plus, Loader2 } from "lucide-react";
import { ContainerRunnerModal } from "@/components/containers/runner/ContainerRunnerModal";
import { ContainerRunConfig } from "@/components/containers/runner/types";
import { toast } from "sonner";
import { ContainerRunnerUpdateModal } from "@/components/containers/runner/ContainerRunnerUpdateModal";
import { useContainers } from 'src/hooks/useContainers';

function ContainersPage() {
  const [showRunnerModal, setShowRunnerModal] = useState(false);

  const {
    selectedContainer,
    showDetails,
    hideDetails,
    editSelected,
    editing: editingContainer,
  } = useContainerDetails();
  
  const { containers,setContainers, loading, error, refetch } = useContainers();


  if (error) {
    return <div>Error loading containers: {error.message}</div>;
  }

  return (
    <div key="instances">
      <div className="mb-2 flex items-center w-full gap-2 h-4 text-sm">
        {false && (
          <>
            <Loader2 className="w-3.5 h-3.5" />
            <span>Refreshing</span>
          </>
        )}
      </div>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Containers</h1>
        <div className="mb-2 flex justify-start">
          <button
            type="button"
            onClick={() => setShowRunnerModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                          text-sm font-medium rounded-md text-white bg-gray-600 
                          hover:bg-gray-700 focus:outline-none focus:ring-2 
                          focus:ring-offset-2 focus:ring-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Conatiner
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
        ):(
          <ContainerList
            showDetails={showDetails}
            containers={containers || []}
            setContainers={setContainers}
            editSelected={editSelected}
            loading={loading}
            onRefresh={refetch}
          />
        )}
      </div>
      {selectedContainer && !editingContainer && (
        <ContainerDetails
          container={selectedContainer}
          onClose={hideDetails}
          showDetails={showDetails}
          setContainers={setContainers}
          editSelected={editSelected}
        />
      )}

      <ContainerRunnerModal
        open={showRunnerModal}
        onClose={() => setShowRunnerModal(false)}
        onSubmit={async (data: ContainerRunConfig) => {
          const reasponse = await fetch("/api/containers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "run",
              instanceConfig: data,
            }),
          });

          const responseData = await reasponse.json();
          if (responseData.error) {
            toast.error(responseData.message);
            return;
          }
          setShowRunnerModal(false);
          toast.success(responseData.message);
          setContainers((prev) => {
            showDetails(responseData.container);
            return [responseData.container, ...prev];
          });
        }}
      />
      {selectedContainer && (
        <ContainerRunnerUpdateModal
          open={editingContainer}
          data={selectedContainer}
          onClose={() => editSelected(false)}
          onSubmit={async (data: ContainerRunConfig) => {
            const reasponse = await fetch("/api/containers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                containerId: selectedContainer.id,
                updateInstanceConfig: data,
              }),
            });

            const responseData = await reasponse.json();
            if (responseData.error) {
              toast.error(responseData.message);
              return;
            }
            setShowRunnerModal(false);
            toast.success(responseData.message);
            setContainers((prev) => {
              showDetails(responseData.container);
              editSelected(false);
              return [responseData.container, ...prev];
            });
          }}
        />
      )}
    </div>
  );
}

export default ContainersPage;

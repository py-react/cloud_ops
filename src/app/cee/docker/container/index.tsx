import React, { useState } from "react";
import { ContainerDetails } from "@/components/docker/containers/details/ContainerDetails";
import { useContainerDetails } from "@/components/docker/containers/hooks/useContainerDetails";
import { Plus, Loader2, ContainerIcon, ChevronRight, Terminal, ServerIcon } from "lucide-react";
import { ContainerRunnerForm } from "@/components/docker/containers/forms/ContainerRunnerForm";
// import { ContainerRunConfig } from "@/components/docker/containers/forms/types";
import { toast } from "sonner";
import { ContainerRunnerUpdateModal } from "@/components/docker/containers/forms/ContainerRunnerUpdateModal";
import { useContainers } from 'src/hooks/useContainers';
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContainersTable } from '@/components/docker/containers/list/ContainersTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DefaultService, DockerConfig } from "@/gingerJs_api_client";

function ContainersPage() {
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const {
    selectedContainer,
    showDetails,
    hideDetails,
    editSelected,
    editing: editingContainer,
    editSelected: setEditing,
  } = useContainerDetails();
  const { containers, setContainers, loading, error, refetch } = useContainers();
  const [runnerSubmitting, setRunnerSubmitting] = useState(false);

  if (error) {
    return <div>Error loading containers: {error.message}</div>;
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <ContainerIcon className="h-4 w-4" />
              <h2>Containers</h2>
            </div>
          }
          shortDescription="View and manage Docker containers—inspect running instances, view logs, and perform basic lifecycle actions."
          description="Docker containers are lightweight, portable environments that package an application and its dependencies into a single executable unit. They form the foundation of containerized workloads and are commonly used as the runtime units within Kubernetes Pods. Each container runs from a Docker image and can be independently started, stopped, or inspected. This"
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Containers</CardTitle>
              <CardDescription>
                {containers.length} containers found
              </CardDescription>
            </div>
            <Button onClick={() => setShowRunnerModal(true)}>
              <ContainerIcon className="w-4 h-4 mr-2" />
              Run Container
            </Button>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            ) : (
              <ContainersTable
                containers={containers || []}
                onView={showDetails}
                onEdit={(container) => { editSelected(true); showDetails(container); }}
                onLogs={() => { /* implement logs handler if needed */ }}
                onStop={async (container) => {
                  // Stop container logic
                  await DefaultService.apiDockerContainersPost({requestBody:{
                    action:"stop",
                    containerId:container.id
                  }})
                  refetch();
                }}
                onDelete={async (container) => {
                  // Remove container logic
                  await DefaultService.apiDockerContainersPost({requestBody:{
                    action:"remove",
                    containerId:container.id
                  }})
                  
                  refetch();
                }}
                onRerun={async (container) => {
                  // Rerun container logic
                  await DefaultService.apiDockerContainersPost({requestBody:{
                    action:"rerun",
                    containerId:container.id
                  }})
                  
                  refetch();
                }}
                onPause={async (container) => {
                  // Pause container logic
                  
                  await DefaultService.apiDockerContainersPost({requestBody:{
                    action:"pause",
                    containerId:container.id
                  }})
                  refetch();
                }}
                loading={loading}
                onRefresh={refetch}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={showRunnerModal} onOpenChange={setShowRunnerModal}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <ContainerIcon className="h-5 w-5" />
              Container Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <ContainerRunnerForm
              onSubmitHandler={async (data: DockerConfig) => {
                setRunnerSubmitting(true);
                await DefaultService.apiDockerContainersPost({
                  requestBody: {
                    action: "run",
                    instanceConfig: data,
                  },
                }).then((res) => {
                  if (res.error) {
                    toast.error(res.message);
                    return;
                  }
                  setShowRunnerModal(false);
                  toast.success(res.message);
                  showDetails(res.container);
                  refetch();
                });
                
              }}
              submitting={runnerSubmitting}
              setSubmitting={setRunnerSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
      {selectedContainer && !editingContainer && (
        <ContainerDetails
          container={selectedContainer}
          onClose={hideDetails}
          showDetails={showDetails}
          setContainers={setContainers}
          editSelected={editSelected}
        />
      )}
      {selectedContainer && (
        <ContainerRunnerUpdateModal
          open={editingContainer}
          data={selectedContainer}
          onClose={() => editSelected(false)}
          onSubmit={async (data: DockerConfig) => {
            await DefaultService.apiDockerContainersPost({
              requestBody: {
                action: "update",
                containerId: selectedContainer.id,
                updateInstanceConfig: data,
              }
            }).then((response) => {
              setEditing(false);
              refetch();
              toast.success(response.message);
            }).catch((error) => {
              toast.error(error.message);
            })
          }}
        />
      )}
    </div>
  );
}

export default ContainersPage;

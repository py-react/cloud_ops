import React, { useState } from "react";
import { ContainerDetails } from "@/components/containers/ContainerDetails";
import { useContainerDetails } from "@/components/containers/hooks/useContainerDetails";
import { Plus, Loader2, ContainerIcon, ChevronRight, Terminal, ServerIcon } from "lucide-react";
import { ContainerRunnerForm } from "@/components/containers/runner/ContainerRunnerForm";
import { ContainerRunConfig } from "@/components/containers/runner/types";
import { toast } from "sonner";
import { ContainerRunnerUpdateModal } from "@/components/containers/runner/ContainerRunnerUpdateModal";
import { useContainers } from 'src/hooks/useContainers';
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContainersTable } from '@/components/containers/ContainersTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function ContainersPage() {
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const {
    selectedContainer,
    showDetails,
    hideDetails,
    editSelected,
    editing: editingContainer,
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
                  await fetch("/api/containers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "stop", containerId: container.id }),
                  });
                  refetch();
                }}
                onDelete={async (container) => {
                  // Remove container logic
                  await fetch("/api/containers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "remove", containerId: container.id }),
                  });
                  refetch();
                }}
                onRerun={async (container) => {
                  // Rerun container logic
                  await fetch("/api/containers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "rerun", containerId: container.id }),
                  });
                  refetch();
                }}
                onPause={async (container) => {
                  // Pause container logic
                  await fetch("/api/containers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "pause", containerId: container.id }),
                  });
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
              onSubmitHandler={async (data: ContainerRunConfig) => {
                setRunnerSubmitting(true);
                const response = await fetch("/api/containers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "run",
                    instanceConfig: data,
                  }),
                });
                const responseData = await response.json();
                setRunnerSubmitting(false);
                if (responseData.error) {
                  toast.error(responseData.message);
                  return;
                }
                setShowRunnerModal(false);
                toast.success(responseData.message);
                showDetails(responseData.container);
                refetch();
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

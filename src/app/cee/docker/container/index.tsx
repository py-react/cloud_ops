import React, { useState } from "react";
import { ContainerDetails } from "@/components/docker/containers/details/ContainerDetails";
import { useContainerDetails } from "@/components/docker/containers/hooks/useContainerDetails";
import { Plus, Loader2, ContainerIcon, ChevronRight, Terminal, ServerIcon, RefreshCw, Play, StopCircleIcon, PauseIcon } from "lucide-react";
import { ContainerRunnerForm } from "@/components/docker/containers/forms/ContainerRunnerForm";
// import { ContainerRunConfig } from "@/components/docker/containers/forms/types";
import { toast } from "sonner";
import { ContainerRunnerUpdateModal } from "@/components/docker/containers/forms/ContainerRunnerUpdateModal";
import { useContainers } from 'src/hooks/useContainers';
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContainersTable } from '@/components/docker/containers/list/ContainersTable';
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const stats = {
    total: containers.length,
    running: containers.filter(c => c.status?.toLowerCase() === 'running').length,
    stopped: containers.filter(c => c.status?.toLowerCase() === 'exited' || c.status?.toLowerCase() === 'stopped').length,
    paused: containers.filter(c => c.status?.toLowerCase() === 'paused').length,
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-2.5 overflow-hidden pr-1">
      {/* Page Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-b border-border/100 pb-2 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <ContainerIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Containers</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                Monitor and control the lifecycle of your virtualized workloads.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient" onClick={() => setShowRunnerModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Container
          </Button>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
        <ResourceCard
          title="Active"
          count={stats.running}
          icon={<Play className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Stopped"
          count={stats.stopped}
          icon={<StopCircleIcon className="w-4 h-4" />}
          color="bg-orange-500"
          className="border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Paused"
          count={stats.paused}
          icon={<PauseIcon className="w-4 h-4" />}
          color="bg-amber-500"
          className="border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Total"
          count={stats.total}
          icon={<ContainerIcon className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={loading}
        />
      </div>

      <div className="flex-1 min-h-0 mt-10">
        {loading ? (
          <div className="flex items-center justify-center h-64 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ContainersTable
            containers={containers || []}
            onView={showDetails}
            onEdit={(container) => { editSelected(true); showDetails(container); }}
            onLogs={() => { /* implement logs handler if needed */ }}
            onStop={async (container) => {
              // Stop container logic
              await DefaultService.apiDockerContainersPost({
                requestBody: {
                  action: "stop",
                  containerId: container.id
                }
              })
              refetch();
            }}
            onDelete={async (container) => {
              // Remove container logic
              await DefaultService.apiDockerContainersPost({
                requestBody: {
                  action: "remove",
                  containerId: container.id
                }
              })

              refetch();
            }}
            onRerun={async (container) => {
              // Rerun container logic
              await DefaultService.apiDockerContainersPost({
                requestBody: {
                  action: "rerun",
                  containerId: container.id
                }
              })

              refetch();
            }}
            onPause={async (container) => {
              // Pause container logic

              await DefaultService.apiDockerContainersPost({
                requestBody: {
                  action: "pause",
                  containerId: container.id
                }
              })
              refetch();
            }}
            onBulkRerun={async (containers) => {
              toast.promise(
                Promise.all(containers.map(c => DefaultService.apiDockerContainersPost({
                  requestBody: { action: "rerun", containerId: c.id }
                }))),
                {
                  loading: `Restarting ${containers.length} containers...`,
                  success: () => { refetch(); return `Successfully restarted ${containers.length} containers`; },
                  error: 'Failed to restart some containers',
                }
              );
            }}
            onBulkPause={async (containers) => {
              toast.promise(
                Promise.all(containers.map(c => DefaultService.apiDockerContainersPost({
                  requestBody: { action: "pause", containerId: c.id }
                }))),
                {
                  loading: `Pausing ${containers.length} containers...`,
                  success: () => { refetch(); return `Successfully paused ${containers.length} containers`; },
                  error: 'Failed to pause some containers',
                }
              );
            }}
            onBulkStop={async (containers) => {
              toast.promise(
                Promise.all(containers.map(c => DefaultService.apiDockerContainersPost({
                  requestBody: { action: "stop", containerId: c.id }
                }))),
                {
                  loading: `Stopping ${containers.length} containers...`,
                  success: () => { refetch(); return `Successfully stopped ${containers.length} containers`; },
                  error: 'Failed to stop some containers',
                }
              );
            }}
            onBulkDelete={async (containers) => {
              toast.promise(
                Promise.all(containers.map(c => DefaultService.apiDockerContainersPost({
                  requestBody: { action: "remove", containerId: c.id }
                }))),
                {
                  loading: `Removing ${containers.length} containers...`,
                  success: () => { refetch(); return `Successfully removed ${containers.length} containers`; },
                  error: 'Failed to remove some containers',
                }
              );
            }}
            loading={loading}
            onRefresh={refetch}
            title="Workload Registry"
            description="Connected container runtime nodes and service lifecycle"
            icon={<ContainerIcon className="h-4 w-4" />}
          />
        )}
      </div>

      <ContainerRunnerForm
        isWizardOpen={showRunnerModal}
        setIsWizardOpen={setShowRunnerModal}
        onSubmitHandler={async (data: DockerConfig) => {
          setRunnerSubmitting(true);
          await DefaultService.apiDockerContainersPost({
            requestBody: {
              action: "run",
              instanceConfig: data,
            },
          }).then((res: any) => {
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
      {
        selectedContainer && !editingContainer && (
          <ContainerDetails
            container={selectedContainer!}
            onClose={hideDetails}
            showDetails={showDetails}
            setContainers={setContainers}
            editSelected={editSelected}
          />
        )
      }
      {
        selectedContainer && (
          <ContainerRunnerUpdateModal
            open={editingContainer}
            data={selectedContainer!}
            onClose={() => editSelected(false)}
            onSubmit={async (data: DockerConfig) => {
              if (!selectedContainer) return;
              await DefaultService.apiDockerContainersPost({
                requestBody: {
                  action: "update",
                  containerId: selectedContainer.id,
                  updateInstanceConfig: data,
                }
              }).then((response: any) => {
                setEditing(false);
                refetch();
                toast.success(response.message);
              }).catch((error) => {
                toast.error(error.message);
              })
            }}
          />
        )
      }
    </div>
  );
}

export default ContainersPage;

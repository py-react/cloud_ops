import React, { useState, useEffect } from "react";
import {
  ContainerIcon,
  Plus,
  RefreshCw,
  Box,
  Activity,
  Layers,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ContainersTable } from "@/components/docker/containers/list/ContainersTable";
import { ContainerRunnerUpdateModal } from "@/components/docker/containers/forms/ContainerRunnerUpdateModal";
import { ContainerDetails } from "@/components/docker/containers/details/ContainerDetails";
import { DefaultService, ContainerInfo } from "@/gingerJs_api_client";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";

const ContainersPage = () => {
  const [data, setData] = useState<ContainerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState<ContainerInfo | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<ContainerInfo | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiDockerContainersGet();
      setData(response.containers || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch containers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  const handleAction = async (action: string, container: ContainerInfo) => {
    try {
      const response: any = await DefaultService.apiDockerContainersPost({
        requestBody: {
          action: action,
          containerId: container.id
        }
      });
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message || `Action failed: ${action}`);
    }
  };

  const stats = {
    total: data.filter(c => !!c).length,
    running: data.filter(c => c && c.status === 'running').length,
    images: Array.from(new Set(data.filter(c => c && c.image).map(c => c.image))).length
  };

  return (
    <PageLayout
      title="Containers"
      subtitle="Monitor and control the lifecycle of your virtualized workloads."
      icon={ContainerIcon}
      actions={
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
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <ResourceCard
          title="Total Containers"
          count={stats.total}
          icon={<Box className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={isLoading}
        />
        <ResourceCard
          title="Running"
          count={stats.running}
          icon={<Activity className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={isLoading}
        />
        <ResourceCard
          title="Total Images"
          count={stats.images}
          icon={<Layers className="w-4 h-4" />}
          color="bg-blue-500"
          className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          isLoading={isLoading}
        />
        <ResourceCard
          title="Status"
          count="Healthy"
          icon={<ShieldCheck className="w-4 h-4" />}
          color="bg-indigo-500"
          className="border-indigo-500/20 bg-indigo-500/5 shadow-none hover:border-indigo-500/30 transition-all"
          isLoading={isLoading}
        />
      </div>

      {/* Containers Table Section */}
      <div className="flex-1 bg-card/10 backdrop-blur-md rounded-xl border border-border/40 overflow-hidden flex flex-col min-h-0">
        <ContainersTable
          containers={data}
          loading={isLoading}
          onView={(container) => setSelectedContainer(container)}
          onEdit={(container) => {
            setEditingContainer(container);
            setShowRunnerModal(true);
          }}
          onLogs={(container) => setSelectedContainer(container)} // Details has logs tab
          onStop={(container) => handleAction('stop', container)}
          onDelete={(container) => handleAction('remove', container)}
          onRerun={(container) => handleAction('rerun', container)}
          onPause={(container) => handleAction('pause', container)}
          onRefresh={refetch}
        />
      </div>

      {/* Modals */}
      <ContainerRunnerUpdateModal
        isWizardOpen={showRunnerModal}
        setIsWizardOpen={(isOpen) => {
          setShowRunnerModal(isOpen);
          if (!isOpen) setEditingContainer(null);
        }}
        editingContainer={editingContainer as any}
        onSubmitHandler={async (data) => {
          try {
            const action = editingContainer ? 'update' : 'create';
            const response: any = await DefaultService.apiDockerContainersPost({
              requestBody: {
                action: action,
                create_config: data,
                containerId: editingContainer?.id
              }
            });
            if (response.error) {
              toast.error(response.message);
            } else {
              toast.success(response.message);
              setShowRunnerModal(false);
              setEditingContainer(null);
              refetch();
            }
          } catch (error: any) {
            toast.error(error.message || "Failed to save container");
          }
        }}
      />

      {selectedContainer && (
        <ContainerDetails
          container={selectedContainer as any}
          onClose={() => setSelectedContainer(null)}
          setContainers={setData as any}
          showDetails={(container) => setSelectedContainer(container as any)}
          editSelected={(show) => {
            if (show) {
              setEditingContainer(selectedContainer);
              setShowRunnerModal(true);
              setSelectedContainer(null);
            }
          }}
        />
      )}
    </PageLayout>
  );
};

export default ContainersPage;

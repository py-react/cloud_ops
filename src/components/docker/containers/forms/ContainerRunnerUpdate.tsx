import React, { useState } from 'react';
import { ContainerIcon } from 'lucide-react';
import { Container } from '@/types/container';
import { formatBytesForForm } from '@/libs/utils';
import { ResourceConfig } from './sections/ResourceConfig';
import { useContainerStats } from '@/hooks/useContainerStats';
import { DockerConfig } from '@/gingerJs_api_client';
import { FormWizard } from '@/components/wizard/form-wizard';
import * as z from 'zod';

const steps = [
  {
    id: 'resources',
    label: 'Resource Allocation',
    description: 'Control how much CPU and memory the container can use.',
    longDescription: "Manage your host's resources by setting limits on the container. You can specify CPU shares to prioritize containers and set hard memory limits to prevent a single container from consuming too much RAM. Memory reservations act as soft limits, while memory swap allows the container to use swap space if it exceeds its memory limit.",
    component: ResourceConfig
  },
]

export const ContainerRunnerUpdate = ({
  onSubmitHandler,
  submitting,
  setSubmitting,
  data,
  isWizardOpen,
  setIsWizardOpen,
}: {
  data: Container;
  onSubmitHandler: (data: DockerConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}) => {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const { stats, loading: statsLoading } = useContainerStats(data.id);

  const onSubmit = async (formData: any) => {
    try {
      if (submitting) return;
      setSubmitting(true);
      await onSubmitHandler(formData as DockerConfig);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
    }
  };

  if (statsLoading) return null;

  return (
    <FormWizard
      name="container-update-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps}
      schema={z.any()}
      initialValues={{
        image: data.image,
        memory: data.host_config.Memory ? formatBytesForForm(data.host_config.Memory) :
          stats?.memory_stats?.limit ? formatBytesForForm(stats.memory_stats.limit) : "",
        cpuShares: data.host_config.CpuShares ? String(data.host_config.CpuShares) : undefined,
        memoryReservation: data.host_config.MemoryReservation ? formatBytesForForm(data.host_config.MemoryReservation) : "",
        memorySwap: data.host_config.MemorySwap ? formatBytesForForm(data.host_config.MemorySwap) : ""
      }}
      onSubmit={onSubmit}
      submitLabel="Update Container"
      submitIcon={ContainerIcon}
      heading={{
        primary: "Update Container",
        secondary: `Modify resource allocation for ${data.name}`,
        icon: ContainerIcon,
      }}
    />
  );
};

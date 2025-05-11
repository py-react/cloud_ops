import React, { useState } from 'react';
import { useForm, Controller, UseFormRegister } from 'react-hook-form';
import { Tabs } from '@/components/ui/tabs';
import { ContainerRunConfig } from './types';
import { LoaderIcon } from 'lucide-react';
import { Container } from '@/types/container';
import { formatBytesForForm } from '@/libs/utils';
import { toast } from 'sonner';
import { ResourceConfig } from './sections/ResourceConfig';
import { useContainerStats } from '@/hooks/useContainerStats';

const tabs = [
    { id: 'resources', label: 'Resources' },
  ];

// This type represents just the resource configuration fields we're updating
type ResourceUpdateConfig = Pick<ContainerRunConfig, 'memory' | 'cpuShares' | 'memoryReservation' | 'memorySwap'>;

export const ContainerRunnerUpdate = ({
  onSubmitHandler,
  submitting,
  setSubmitting,
  data,
}: {
  data: Container;
  onSubmitHandler: (data: ContainerRunConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [activeTab] = useState("resources");
  const { stats, loading: statsLoading } = useContainerStats(data.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResourceUpdateConfig>({
    defaultValues: {
      memory: data.host_config.Memory ? formatBytesForForm(data.host_config.Memory) : 
             stats?.memory_stats?.limit ? formatBytesForForm(stats.memory_stats.limit) : "",
      cpuShares: data.host_config.CpuShares ? data.host_config.CpuShares : undefined,
      memoryReservation: data.host_config.MemoryReservation ? formatBytesForForm(data.host_config.MemoryReservation) : "",
      memorySwap: data.host_config.MemorySwap ? formatBytesForForm(data.host_config.MemorySwap) : ""
    },
  });

  const onSubmit = async(formData: ResourceUpdateConfig) => {
    try {
        if(submitting) return;
        setSubmitting(true);
        // Convert form values to ContainerRunConfig format
        const configData: ContainerRunConfig = {
          image: data.image, // Required by ContainerRunConfig but not used in update
          ...formData
        };
        await onSubmitHandler(configData);
        setSubmitting(false);
      } catch (error) {
        toast.error(`Failed to update container: ${error}`);
        setSubmitting(false);
      }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderIcon className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={() => {}} />
      <ResourceConfig register={register} errors={errors} />

      <div className="flex justify-end pt-4 border-t">
        <button
          disabled={submitting}
          type="submit"
          className={`px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex justify-between items-center ${
                     submitting ? "pointer-events-none" : "pointer-events-auto"
                   }`}
        >
          {submitting && <LoaderIcon className="w-4 h-4 mr-2" />}
          Update
        </button>
      </div>
    </form>
  );
};


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs } from '@/components/ui/tabs';
import { BasicConfig } from './sections/BasicConfig';
import { ResourceConfig } from './sections/ResourceConfig';
import { NetworkConfig } from './sections/NetworkConfig';
import { VolumeConfig } from './sections/VolumeConfig';
import { HealthConfig } from './sections/HealthConfig';
import { AdvancedConfig } from './sections/AdvancedConfig';
import { SecurityConfig } from './sections/SecurityConfig';
import type { ContainerRunConfig } from './types';
import { toast } from 'sonner';
import { LoaderIcon, PlayCircleIcon, Plus } from 'lucide-react';

const tabs = [
  { id: 'basic', label: 'Basic' },
  { id: 'resources', label: 'Resources' },
  { id: 'network', label: 'Network' },
  { id: 'storage', label: 'Storage' },
  { id: 'health', label: 'Health Check' },
  { id: 'security', label: 'Security' },
  { id: 'advanced', label: 'Advanced' },
];

export function ContainerRunnerForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: {
  onSubmitHandler: (data: ContainerRunConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContainerRunConfig>({
    defaultValues: {
      image: "",
      detach: true,
      removeOnExit: false,
      privileged: false,
      init: false,
      tty: false,
      stdinOpen: false,
      readOnly: false,
      ports: {},
      volumes: [],
      healthcheck: {
        test: [],
        interval: 30000000000,
        timeout: 3000000000,
        retries: 3,
        startPeriod: 1000000000,
      },
    },
  });

  const onSubmit = async (data: ContainerRunConfig) => {
    try {
      if(submitting)return
      setSubmitting(true);
      await onSubmitHandler(data);
      setSubmitting(false);
      // TODO: Implement actual container run API call
    } catch (error) {
      toast.error(`Failed to run container: ${error}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <BasicConfig register={register} errors={errors} watch={watch} />
        );
      case "resources":
        return <ResourceConfig register={register} errors={errors} />;
      case "network":
        return (
          <NetworkConfig
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case "storage":
        return (
          <VolumeConfig
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case "health":
        return (
          <HealthConfig
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case "security":
        return (
          <SecurityConfig
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        );
      case "advanced":
        return (
          <AdvancedConfig register={register} watch={watch} errors={errors} />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">{renderTabContent()}</div>

      <div className="flex justify-end pt-4 border-t">
        <button
          disabled={submitting}
          type="submit"
          className={`px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex justify-between items-center ${
                     submitting ? "pointer-events-none" : "pointer-events-auto"
                   }`}
        >
          {submitting ? (
            <LoaderIcon className="w-4 h-4 mr-2" />
          ) : (
            <PlayCircleIcon className="w-4 h-4 mr-2" />
          )}
          Run Container
        </button>
      </div>
    </form>
  );
}
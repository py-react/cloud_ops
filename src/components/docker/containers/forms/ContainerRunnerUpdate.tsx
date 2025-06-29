import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ContainerRunConfig } from './types';
import { ContainerIcon, Info, Loader2, LoaderIcon } from 'lucide-react';
import { Container } from '@/types/container';
import { formatBytesForForm } from '@/libs/utils';
import { toast } from 'sonner';
import { ResourceConfig } from './sections/ResourceConfig';
import { useContainerStats } from '@/hooks/useContainerStats';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { DockerConfig } from '@/gingerJs_api_client';

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
}: {
  data: Container;
  onSubmitHandler: (data: DockerConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [activeTab,setActiveTab] = useState(steps[0].id);
  const { stats, loading: statsLoading } = useContainerStats(data.id);

  const form = useForm<DockerConfig>({
    defaultValues: {
      image: data.image,
      memory: data.host_config.Memory ? formatBytesForForm(data.host_config.Memory) : 
             stats?.memory_stats?.limit ? formatBytesForForm(stats.memory_stats.limit) : "",
      cpuShares: data.host_config.CpuShares ? data.host_config.CpuShares : undefined,
      memoryReservation: data.host_config.MemoryReservation ? formatBytesForForm(data.host_config.MemoryReservation) : "",
      memorySwap: data.host_config.MemorySwap ? formatBytesForForm(data.host_config.MemorySwap) : ""
    },
  });
  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = async(formData: DockerConfig) => {
    try {
      if(submitting) return;
      setSubmitting(true);
      await onSubmitHandler(formData);
      setSubmitting(false);
    } catch (error) {
      toast.error(`Failed to update container: ${error}`);
      setSubmitting(false);
    }
  };

  const handleTabChange = (id: string) => {
    if (form.getValues('image')) {
      setActiveTab(id);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderIcon className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Helper to pass only the correct props to each section
  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
  };

  

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs, Step Info, and Run Button */}
      <div className="flex flex-row pb-2 items-center justify-between mb-6">
        <div className="flex items-center w-full">
          <Tabs
            tabs={steps.map(({ id, label }) => ({ id, label }))}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md ">
        {/* Step Information Card */}
        <div className="col-span-1">
          <Card className="pt-6 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>{currentStepData.label}</CardTitle>
              </div>
              <CardDescription>{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {currentStepData.longDescription}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Main Form Area (scrollable) */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form
                id="container-runner-form"
                className="space-y-6"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-6">
                  {/* Step Content */}
                  <div className="mt-6">
                    <CurrentStepComponent {...sectionProps} />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>
      {/* Navigation Footer (always at the bottom) */}
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-4 w-full justify-end">
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={!form.getValues("image") || submitting}
            className="ml-4"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ContainerIcon className="h-4 w-4 mr-2" />
            )}
            Update Container
          </Button>
        </div>
      </div>
    </div>
  )
};


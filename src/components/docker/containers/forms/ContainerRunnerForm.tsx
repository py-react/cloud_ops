import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BasicConfig } from './sections/BasicConfig';
import { ResourceConfig } from './sections/ResourceConfig';
import { NetworkConfig } from './sections/NetworkConfig';
import { VolumeConfig } from './sections/VolumeConfig';
import { HealthConfig } from './sections/HealthConfig';
import { AdvancedConfig } from './sections/AdvancedConfig';
import { SecurityConfig } from './sections/SecurityConfig';
import type { ContainerRunConfig } from './types';
import { toast } from 'sonner';
import { Loader2, Info, ContainerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs } from '@/components/ui/tabs';

const steps = [
  {
    id: 'basic',
    label: 'Basic Configuration',
    description: 'Define the core container settings, including the image and name.',
    longDescription: 'Every container starts with a Docker image. Specify the image to use (e.g., `nginx:latest`). You can also give your container a memorable name and define the command it should run upon startup. Use the checkboxes to control its lifecycle behavior, like detaching it to run in the background or automatically removing it when it stops.',
    component: BasicConfig
  },
  {
    id: 'resources',
    label: 'Resource Allocation',
    description: 'Control how much CPU and memory the container can use.',
    longDescription: "Manage your host's resources by setting limits on the container. You can specify CPU shares to prioritize containers and set hard memory limits to prevent a single container from consuming too much RAM. Memory reservations act as soft limits, while memory swap allows the container to use swap space if it exceeds its memory limit.",
    component: ResourceConfig
  },
  {
    id: 'network',
    label: 'Network Settings',
    description: 'Configure networking and expose container ports to the host.',
    longDescription: "Connect your container to networks and make its services accessible. Choose a network mode to define how the container interacts with the host's network stack. Use port mappings to expose a container's internal ports to the host machine, allowing you to access applications running inside the container (e.g., map host port 8080 to container port 80).",
    component: NetworkConfig
  },
  {
    id: 'storage',
    label: 'Storage Configuration',
    description: "Persist data using volumes and set the container's working directory.",
    longDescription: 'Containers have an ephemeral filesystem. To persist data, you can mount host directories or named volumes into the container. This is crucial for databases, user-uploaded content, or any data that needs to survive container restarts. You can also specify the working directory for commands that will be executed inside the container.',
    component: VolumeConfig
  },
  {
    id: 'health',
    label: 'Health Checks',
    description: 'Define a command to check if the container is running correctly.',
    longDescription: "A health check is a command that Docker runs periodically to check if a container is still working. If the command fails a certain number of times, the container is marked as 'unhealthy'. This is useful for orchestration systems to know when to restart a container. You can configure the test command, interval, timeout, and number of retries.",
    component: HealthConfig
  },
  {
    id: 'security',
    label: 'Security Settings',
    description: 'Adjust security settings and Linux capabilities.',
    longDescription: "Fine-tune the security profile of your container. By default, containers run with a limited set of Linux capabilities for security. You can add or drop capabilities to grant or remove specific kernel permissions. For example, `NET_RAW` is needed for some networking tools, but it's a security risk if not required. You can also configure user namespace modes for advanced isolation.",
    component: SecurityConfig
  },
  {
    id: 'advanced',
    label: 'Advanced Options',
    description: 'Configure advanced runtime and process options.',
    longDescription: "This section provides fine-grained control over the container's runtime environment. You can specify the user to run processes as, set a hostname and domain name, and enable options like an init process for better signal handling. You can also control TTY allocation and whether to keep STDIN open, which is useful for interactive sessions.",
    component: AdvancedConfig
  }
];

const portMappingSchema = z.object({
  hostPort: z.number().optional(),
  containerPort: z.number(),
  protocol: z.enum(["tcp", "udp", "sctp"]),
});

const healthcheckSchema = z.object({
  test: z.array(z.string()),
  interval: z.number(),
  timeout: z.number(),
  retries: z.number(),
  startPeriod: z.number().optional(),
});

const volumeSchema = z.object({
  source: z.string(),
  target: z.string(),
  mode: z.enum(["rw", "ro"]),
});

const schema = z.object({
  image: z.string().min(1, "Image name is required"),
  name: z.string().min(1, "Container name is required"),
  command: z.string().optional(),
  detach: z.boolean().optional(),
  remove: z.boolean().optional(),
  privileged: z.boolean().optional(),
  init: z.boolean().optional(),
  tty: z.boolean().optional(),
  stdinOpen: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  ports: z.record(portMappingSchema).optional(),
  volumes: z.array(volumeSchema).optional(),
  healthcheck: healthcheckSchema.optional(),
  auto_remove: z.boolean().optional(),
  cpuShares: z.string().optional(),
  memory: z.string().optional(),
  memoryReservation: z.string().optional(),
  memorySwap: z.string().optional(),
});

const defaultValues = {
  image: "",
  name: "",
  command: "",
  detach: true,
  remove: false,
  privileged: true,
  init: false,
  tty: false,
  stdinOpen: false,
  readOnly: false,
  ports: {},
  volumes: [],
  healthcheck: undefined,
  auto_remove: false,
  cpuShares: "",
  memory: "",
  memoryReservation: "",
  memorySwap: "",
};

export function ContainerRunnerForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: {
  onSubmitHandler: (data: ContainerRunConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<ContainerRunConfig>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: ContainerRunConfig) => {
    console.log({data})
    try {
      if(submitting) return;
      setSubmitting(true);
      await onSubmitHandler(data);
      setSubmitting(false);
    } catch (error) {
      toast.error(`Failed to run container: ${error}`);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  // Helper to pass only the correct props to each section
  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
  };

  const handleTabChange = (id: string) => {
    if (form.getValues('image')) {
      setActiveTab(id);
    }
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
                onSubmit={form.handleSubmit(onSubmit)}
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
            form="container-runner-form"
            type="submit"
            disabled={!form.getValues("image") || submitting}
            className="ml-4"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ContainerIcon className="h-4 w-4 mr-2" />
            )}
            Run Container
          </Button>
        </div>
      </div>
    </div>
  );
}
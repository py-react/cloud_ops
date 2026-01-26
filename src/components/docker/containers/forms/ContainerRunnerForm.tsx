import React, { useState } from 'react';
import { BasicConfig } from './sections/BasicConfig';
import { ResourceConfig } from './sections/ResourceConfig';
import { NetworkConfig } from './sections/NetworkConfig';
import { VolumeConfig } from './sections/VolumeConfig';
import { HealthConfig } from './sections/HealthConfig';
import { AdvancedConfig } from './sections/AdvancedConfig';
import { SecurityConfig } from './sections/SecurityConfig';
import { toast } from 'sonner';
import { ContainerIcon, Cpu, Network, HardDrive, Activity, Shield, Sliders, Info } from 'lucide-react';
import * as z from "zod";
import { DockerConfig } from '@/gingerJs_api_client';
import { FormWizard } from '@/components/wizard/form-wizard';

const steps = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: Info,
    description: 'Core container settings',
    longDescription: 'Every container starts with a Docker image. Specify the image to use (e.g., `nginx:latest`). You can also give your container a memorable name and define the command it should run upon startup.',
    component: BasicConfig,
    canNavigateNext: (form: any) => {
      const image = form.watch('image');
      return {
        can: !!image,
        message: "Please specify an image first"
      };
    }
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Cpu,
    description: 'CPU and memory limits',
    longDescription: "Manage your host's resources by setting limits on the container. You can specify CPU shares and set hard memory limits to prevent a single container from consuming too much RAM.",
    component: ResourceConfig
  },
  {
    id: 'network',
    label: 'Networking',
    icon: Network,
    description: 'Ports and network modes',
    longDescription: "Connect your container to networks and make its services accessible. Choose a network mode and use port mappings to expose a container's internal ports to the host machine.",
    component: NetworkConfig
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: HardDrive,
    description: 'Volumes and mounts',
    longDescription: 'Containers have an ephemeral filesystem. To persist data, you can mount host directories or named volumes into the container.',
    component: VolumeConfig
  },
  {
    id: 'health',
    label: 'Health Checks',
    icon: Activity,
    description: 'Runtime health monitoring',
    longDescription: "A health check is a command that Docker runs periodically to check if a container is still working. If it fails, the container is marked as 'unhealthy'.",
    component: HealthConfig
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Capabilities and isolation',
    longDescription: "Fine-tune the security profile of your container. Add or drop Linux capabilities and configure isolation settings.",
    component: SecurityConfig
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Sliders,
    description: 'Runtime and TTY options',
    longDescription: "Fine-grained control over the container's runtime environment, including hostname, user, and TTY allocation.",
    component: AdvancedConfig
  }
];

const portMappingSchema = z.object({
  hostPort: z.number().optional(),
  containerPort: z.number(),
  protocol: z.enum(["tcp", "udp", "sctp"]),
});

const healthcheckSchema = z.object({
  test: z.array(z.string()).optional(),
  interval: z.number().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
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
  isWizardOpen,
  setIsWizardOpen,
}: {
  onSubmitHandler: (data: DockerConfig) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  const onSubmit = async (data: DockerConfig) => {
    try {
      if (submitting) return;
      await onSubmitHandler(data);
    } catch (error) {
      toast.error(`Failed to run container: ${error}`);
    }
  };

  return (
    <FormWizard
      name="container-runner-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps as any}
      schema={schema as any}
      initialValues={defaultValues as any}
      onSubmit={onSubmit}
      submitLabel="Deploy Container"
      submitIcon={ContainerIcon}
      heading={{
        primary: "Run New Container",
        secondary: "Configure and deploy a new Docker instance",
        icon: ContainerIcon,
      }}
    />
  );
}
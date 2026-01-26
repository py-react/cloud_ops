import React, { useState } from 'react';
import * as z from "zod";
import { Network as NetworkIcon, Database, Shield, Sliders } from "lucide-react";
import { FormWizard } from '@/components/wizard/form-wizard';
import { BasicConfig } from "./sections/BasicConfig";
import { IPAMConfig } from "./sections/IPAMConfig";
import { SecurityConfig } from "./sections/SecurityConfig";
import { AdvancedConfig } from "./sections/AdvancedConfig";

// Form validation schema
const createNetworkSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  driver: z.string().default("bridge"),
  scope: z.string().default("local"),
  options: z.record(z.string()).default({}),
  ipam: z.object({
    driver: z.string().default("default"),
    config: z.array(z.record(z.string())).default([])
  }),
  check_duplicate: z.boolean().default(true),
  internal: z.boolean().default(false),
  labels: z.record(z.string()).default({}),
  enable_ipv6: z.boolean().default(false),
  attachable: z.boolean().default(false),
  ingress: z.boolean().default(false)
});

type CreateNetworkFormValues = z.infer<typeof createNetworkSchema>;

interface CreateNetworkFormProps {
  onSubmit: (data: CreateNetworkFormValues) => Promise<void>;
  onCancel: () => void;
}

const steps = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: NetworkIcon,
    description: 'Driver and scope',
    longDescription: 'Every Docker network starts with a name and driver type. The bridge driver is the default, providing a standard network interface for containers.',
    component: BasicConfig,
    canNavigateNext: (form: any) => {
      const name = form.watch('name');
      return { can: !!name, message: "Network name is required to proceed" };
    }
  },
  {
    id: 'ipam',
    label: 'IPAM Settings',
    icon: Database,
    description: 'IP management',
    longDescription: 'Configure how IP addresses are assigned. Specify custom subnets, IP ranges, and gateways for isolated networks.',
    component: IPAMConfig
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Access control',
    longDescription: 'Control how containers interact with the network. Internal networks restrict external access, while attachable networks allow manual attachment.',
    component: SecurityConfig
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Sliders,
    description: 'Labels and options',
    longDescription: 'Fine-tune your network with custom labels and driver-specific options like MTU size or DNS settings.',
    component: AdvancedConfig
  }
];

interface CreateNetworkFormProps {
  onSubmit: (data: CreateNetworkFormValues) => Promise<void>;
  onCancel: () => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

export function CreateNetworkForm({ onSubmit, onCancel, isWizardOpen, setIsWizardOpen }: CreateNetworkFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  return (
    <FormWizard
      name="create-network-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps}
      schema={createNetworkSchema as z.ZodSchema<any>}
      initialValues={{
        name: "",
        driver: "bridge",
        scope: "local",
        options: {},
        ipam: {
          driver: "default",
          config: []
        },
        check_duplicate: true,
        internal: false,
        labels: {},
        enable_ipv6: false,
        attachable: false,
        ingress: false
      }}
      onSubmit={onSubmit}
      submitLabel="Create Network"
      submitIcon={NetworkIcon}
      heading={{
        primary: "Create Docker Network",
        secondary: "Configure a new network for your containers",
        icon: NetworkIcon,
        actions: (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )
      }}
    />
  );
}
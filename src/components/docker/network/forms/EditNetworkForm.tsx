import React, { useState } from 'react';
import * as z from "zod";
import { Network as NetworkIcon, Database, Shield, Sliders } from "lucide-react";
import { FormWizard } from '@/components/wizard/form-wizard';
import { BasicConfig } from "./sections/BasicConfig";
import { IPAMConfig } from "./sections/IPAMConfig";
import { SecurityConfig } from "./sections/SecurityConfig";
import { AdvancedConfig } from "./sections/AdvancedConfig";
import { NetworkInfo } from "@/gingerJs_api_client/models/NetworkInfo";

// Form validation schema
const editNetworkSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  driver: z.string().default("bridge"),
  scope: z.string().default("local"),
  options: z.record(z.string()).default({}),
  ipam: z.object({
    driver: z.string().default("default"),
    config: z.array(z.record(z.string())).default([])
  }).optional(),
  internal: z.boolean().default(false),
  labels: z.record(z.string()).default({}),
  enable_ipv6: z.boolean().default(false),
  attachable: z.boolean().default(false),
  ingress: z.boolean().default(false)
});

type EditNetworkFormValues = z.infer<typeof editNetworkSchema>;

interface EditNetworkFormProps {
  network: NetworkInfo;
  onSubmit: (data: EditNetworkFormValues) => Promise<void>;
  onCancel: () => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

const steps = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: NetworkIcon,
    description: 'Driver and scope',
    longDescription: 'Every Docker network starts with a name and driver type. The bridge driver is the default, providing a standard network interface for containers.',
    component: BasicConfig
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

export function EditNetworkForm({ network, onSubmit, onCancel, isWizardOpen, setIsWizardOpen }: EditNetworkFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  return (
    <FormWizard
      name="edit-network-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps}
      schema={editNetworkSchema as z.ZodSchema<any>}
      initialValues={{
        name: network.Name,
        driver: network.Driver,
        scope: network.Scope,
        options: network.Options || {},
        ipam: network.IPAM ? {
          driver: (network.IPAM as any).Driver || "default",
          config: (network.IPAM as any).Config || [],
        } : undefined,
        internal: network.Internal || false,
        labels: network.Labels || {},
        enable_ipv6: network.EnableIPv6 || false,
        attachable: network.Attachable || false,
        ingress: network.Ingress || false,
      }}
      onSubmit={onSubmit}
      submitLabel="Patch Network"
      submitIcon={NetworkIcon}
      heading={{
        primary: "Update Docker Network",
        secondary: `Modify configuration for ${network.Name}`,
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
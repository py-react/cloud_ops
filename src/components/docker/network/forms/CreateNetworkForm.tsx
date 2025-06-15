import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from "sonner";
import { Network as NetworkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { Form } from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
    label: 'Basic Configuration',
    description: 'Define the core network settings, including name and driver.',
    longDescription: 'Every Docker network starts with a name and driver type. The bridge driver is the default and most common choice, providing a standard network interface for containers. You can also specify a custom scope to control the network\'s visibility. These basic settings form the foundation of your network configuration.',
    component: BasicConfig
  },
  {
    id: 'ipam',
    label: 'IPAM Settings',
    description: 'Configure IP address management for the network.',
    longDescription: 'IPAM (IP Address Management) controls how IP addresses are assigned to containers on the network. You can specify custom subnets, IP ranges, and gateways. This is crucial for creating isolated networks with specific IP addressing schemes. The default IPAM driver automatically assigns IP addresses, but you can customize this behavior.',
    component: IPAMConfig
  },
  {
    id: 'security',
    label: 'Security & Access',
    description: 'Configure network security and access control.',
    longDescription: 'Control how containers interact with the network and external resources. Internal networks restrict external access, while attachable networks allow manual container attachment. You can also enable IPv6 support and configure ingress settings for swarm mode. These settings help secure your network and control container connectivity.',
    component: SecurityConfig
  },
  {
    id: 'advanced',
    label: 'Advanced Options',
    description: 'Configure advanced network settings and metadata.',
    longDescription: 'Fine-tune your network with advanced options and metadata. Add custom labels for better organization and filtering. Configure network-specific options like MTU size or DNS settings. These advanced settings give you precise control over network behavior and help with network management.',
    component: AdvancedConfig
  }
];

export function CreateNetworkForm({ onSubmit, onCancel }: CreateNetworkFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<CreateNetworkFormValues>({
    resolver: zodResolver(createNetworkSchema),
    defaultValues: {
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
    },
  });

  const handleSubmit = async (data: CreateNetworkFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create network:', error);
      toast.error('Failed to create network');
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  // Helper to pass only the correct props to each section
  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
  };

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs */}
      <div className="flex flex-row pb-2 items-center justify-between mb-6">
        <div className="flex items-center w-full">
          <Tabs
            tabs={steps.map(({ id, label }) => ({ id, label }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
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
                id="create-network-form"
                className="space-y-6"
                onSubmit={form.handleSubmit(handleSubmit)}
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
      {/* Navigation Footer */}
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-4 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-network-form"
            disabled={!form.getValues("name")}
          >
            <NetworkIcon className="h-4 w-4 mr-2" />
            Create Network
          </Button>
        </div>
      </div>
    </div>
  );
} 
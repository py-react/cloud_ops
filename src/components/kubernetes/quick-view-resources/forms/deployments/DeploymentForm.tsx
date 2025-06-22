import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { DeploymentFormData } from "./types";
import { BasicConfig } from "./sections/BasicConfig";
import { ContainerConfig } from "./sections/ContainerConfig";
import { LabelsConfig } from "./sections/LabelsConfig";

const steps = [
  {
    id: 'basic',
    label: 'Basic Configuration',
    description: 'Define the core Deployment settings, including name and namespace.',
    longDescription: 'Every Deployment starts with a name and namespace. The name must be unique within the namespace. You can also specify the number of replicas for your application.',
    component: BasicConfig
  },
  {
    id: 'containers',
    label: 'Container Configuration',
    description: 'Configure your application containers, including image, ports, and environment variables.',
    longDescription: 'Containers are the core of your Deployment. You can specify multiple containers, each with its own image, ports, and environment variables. Make sure to provide all required information for your containers to run properly.',
    component: ContainerConfig
  },
  {
    id: 'labels',
    label: 'Labels & Annotations',
    description: 'Add labels and annotations to organize and identify your Deployment.',
    longDescription: 'Labels and annotations help you organize and identify your Deployment. Labels are used for querying and selecting objects, while annotations can store arbitrary metadata.',
    component: LabelsConfig
  }
];

const deploymentSchema = z.object({
  metadata: z.object({
    name: z.string().min(1, "Name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    labels: z.array(z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required")
    })),
    annotations: z.array(z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required")
    }))
  }),
  spec: z.object({
    replicas: z.number().min(1, "At least 1 replica is required"),
    selector: z.object({
      matchLabels: z.record(z.string()).optional(),
    }).optional(),
    template: z.object({
      metadata: z.object({
        labels: z.record(z.string()).optional(),
        annotations: z.record(z.string()).optional(),
      }).optional(),
      spec: z.object({
        containers: z.array(z.object({
          name: z.string().min(1, "Container name is required"),
          image: z.string().min(1, "Image is required"),
          ports: z.array(z.object({
            name: z.string().optional(),
            containerPort: z.number(),
            protocol: z.string().optional(),
          })).optional(),
          env: z.array(z.object({
            name: z.string(),
            value: z.string(),
          })).optional(),
          resources: z.object({
            requests: z.record(z.string()).optional(),
            limits: z.record(z.string()).optional(),
          }).optional(),
          command: z.array(z.string()).optional(),
          args: z.array(z.string()).optional(),
        })).min(1, "At least one container is required"),
        restartPolicy: z.string().optional(),
        terminationGracePeriodSeconds: z.number().optional(),
      }),
    }),
    strategy: z.object({
      type: z.string().optional(),
      rollingUpdate: z.object({
        maxSurge: z.union([z.string(), z.number()]).optional(),
        maxUnavailable: z.union([z.string(), z.number()]).optional(),
      }).optional(),
    }).optional(),
  }),
});

interface DeploymentFormProps {
  onSubmit: (data: DeploymentFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<DeploymentFormData>;
}

export function DeploymentForm({ onSubmit, onCancel, defaultValues }: DeploymentFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<DeploymentFormData>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      metadata: {
        name: "",
        namespace: "default",
        labels: [],
        annotations: []
      },
      spec: {
        replicas: 1,
        template: {
          spec: {
            containers: []
          }
        }
      },
      ...defaultValues
    }
  });

  const handleSubmit = async (data: DeploymentFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
  };

  const handleTabChange = (id: string) => {
    if (form.getValues('metadata.name')) {
      setActiveTab(id);
    }
  };

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs, Step Info, and Create Button */}
      <div className="flex flex-row pb-2 items-center justify-between mb-6">
        <div className="flex items-center w-full">
          <Tabs
            tabs={steps.map(({ id, label }) => ({ id, label }))}
            activeTab={activeTab}
            onChange={handleTabChange}
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
              <form id="deployment-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={!form.getValues("metadata.name") || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating..." : "Create Deployment"}
          </Button>
        </div>
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { BasicSection } from "./sections/BasicSection";
import { ServicePortsSection } from "./sections/ServicePortsSection";
import { ContainersSection } from "./sections/ContainersSection";
import { LabelsAnnotationsSection } from "./sections/LabelsAnnotationsSection";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

export interface ServicePortConfig {
  port: number;
  target_port: number;
  protocol?: string;
}

export interface ResourceRequirements {
  requests?: Record<string, string>;
  limits?: Record<string, string>;
}

export interface EnvVar {
  name: string;
  value?: string;
  value_from?: Record<string, any>;
}

export interface ContainerConfig {
  name: string;
  command?: string[];
  args?: string[];
  env?: EnvVar[];
  ports?: ServicePortConfig[];
  resources?: ResourceRequirements;
}

export interface ReleaseConfigFormData {
  id?:number;
  type: string;
  namespace: string;
  deployment_name: string;
  tag: string;
  code_source_control_name: string;
  deployment_strategy_id: number;
  replicas?: number;
  containers: ContainerConfig[];
  service_ports?: ServicePortConfig[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  soft_delete?:boolean;
  hard_delete?:boolean;
}

const steps = [
  {
    id: "basic",
    label: "Basic Info",
    description: "Basic deployment config info.",
    longDescription: "Set the type, namespace, deployment name, and replicas for this release config.",
    Section: BasicSection,
  },
  {
    id: "containers",
    label: "Containers",
    description: "Configure containers for this deployment.",
    longDescription: "Add, edit, or remove containers for your deployment.",
    Section: ContainersSection,
  },
  {
    id: "service_ports",
    label: "Service Ports",
    description: "Configure service ports for this deployment.",
    longDescription: "Add, edit, or remove service ports for your deployment.",
    Section: ServicePortsSection,
  },
  {
    id: "labels_annotations",
    label: "Labels & Annotations",
    description: "Add labels and annotations.",
    longDescription: "Add labels and annotations for your deployment.",
    Section: LabelsAnnotationsSection,
  },
];

export const ReleaseConfigForm = ({
  namespace,
  onSuccess,
  initialValues,
  isEdit,
}: {
  namespace:string;
  onSuccess: () => void;
  initialValues?: Partial<ReleaseConfigFormData>;
  isEdit?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<ReleaseConfigFormData>({
    defaultValues: {
      type: "",
      namespace: namespace,
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 1,
      containers: [],
      service_ports: [],
      labels: {},
      annotations: {},
      ...initialValues,
    },
  });

  const handleSubmit = async (data: ReleaseConfigFormData) => {
    try {
      if(!initialValues?.deployment_name){
        const response = await DefaultService.apiIntegrationKubernetesReleasePost({ requestBody: {...data,id:initialValues?.id} });
        if (response.status === "success") {
          toast.success("Release config saved successfully!");
          onSuccess();
        } else {
          // TODO: Show error to user
          toast.error("Error creating deployment:", response.message);
        }
      }else{
        const response = await DefaultService.apiIntegrationKubernetesReleasePut({ requestBody: data });
        if (response.status === "success") {
          toast.success("Release config updated successfully!");
          onSuccess();
        } else {
          // TODO: Show error to user
          toast.error("Error Updating deployment:", response.message);
        }
      }
    } catch (error) {
      // TODO: Show error to user
      toast.error("Error submitting form:", error);
    }
  };

  const currentStep = steps.find((s) => s.id === activeTab);
  if (!currentStep) return null;

  const CurrentSection = currentStep.Section;

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs, Step Info, and Create Button */}
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
              <CardTitle>{currentStep.label}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{currentStep.longDescription}</p>
            </CardContent>
          </Card>
        </div>
        {/* Main Form Area (scrollable) */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <CurrentSection control={form.control} setValue={form.setValue} errors={form.formState.errors} />
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>
      {/* Navigation Footer (always at the bottom) */}
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-end items-center mt-4">
        <Button type="submit" form={undefined} onClick={() => form.handleSubmit(handleSubmit)()} disabled={form.formState.isSubmitting}>
          {isEdit ? "Save Changes" : "Create"}
        </Button>
      </div>
    </div>
  );
};

export default ReleaseConfigForm;

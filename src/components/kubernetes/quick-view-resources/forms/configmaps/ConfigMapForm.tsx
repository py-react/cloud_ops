import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ConfigMapFormData, configMapSchema } from "./types";
import { BasicConfig } from "./sections/BasicConfig";
import { DataConfig } from "./sections/DataConfig";
import { LabelsConfig } from "./sections/LabelsConfig";

const steps = [
  {
    id: 'basic',
    label: 'Basic Configuration',
    description: 'Define the core ConfigMap settings, including name and namespace.',
    longDescription: 'Every ConfigMap starts with a name and namespace. The name must be unique within the namespace. You can also specify additional metadata like labels and annotations to help organize and identify your ConfigMap.',
    component: BasicConfig
  },
  {
    id: 'data',
    label: 'Data Configuration',
    description: 'Add key-value pairs for configuration data and binary data.',
    longDescription: 'ConfigMaps store configuration data as key-value pairs. You can add multiple key-value pairs for both regular data and binary data. Binary data should be base64 encoded.',
    component: DataConfig
  },
  {
    id: 'labels',
    label: 'Labels & Annotations',
    description: 'Add labels and annotations to organize and identify your ConfigMap.',
    longDescription: 'Labels and annotations help you organize and identify your ConfigMap. Labels are used for querying and selecting objects, while annotations can store arbitrary metadata.',
    component: LabelsConfig
  }
];

interface ConfigMapFormProps {
  onSubmit: (data: ConfigMapFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<ConfigMapFormData>;
}

export function ConfigMapForm({ onSubmit, onCancel, defaultValues }: ConfigMapFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<ConfigMapFormData>({
    resolver: zodResolver(configMapSchema),
    defaultValues: {
      metadata: {
        name: "",
        namespace: "default",
        labels: [],
        annotations: []
      },
      data: [],
      binaryData: [],
      immutable: false,
      ...defaultValues
    }
  });

  const handleSubmit = async (data: ConfigMapFormData) => {
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
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
            onClick={() => {
              console.log(form.getValues());
              form.handleSubmit(handleSubmit)();
            }}
            disabled={!form.getValues("metadata.name") || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating..." : "Create ConfigMap"}
          </Button>
        </div>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Info, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { Tabs } from '@/components/ui/tabs';
import { BasicConfig } from './sections/BasicConfig';
import { AdvancedConfig } from './sections/AdvancedConfig';

const steps = [
  {
    id: 'basic',
    label: 'Basic Configuration',
    description: 'Define the core volume settings.',
    longDescription: 'Every Docker volume needs a name and can optionally specify a driver. The name must be unique and the driver determines how the volume is managed. The default driver is "local", which stores the volume data on the host filesystem.',
    component: BasicConfig
  },
  {
    id: 'advanced',
    label: 'Advanced Options',
    description: 'Configure driver options and labels.',
    longDescription: 'Driver options allow you to configure specific settings for the volume driver. Labels are key-value pairs that can be used to organize and categorize your volumes. Both are optional and can be specified in JSON format.',
    component: AdvancedConfig
  }
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  driver: z.string().default("local"),
  driver_opts: z.record(z.string()).default({}),
  labels: z.record(z.string()).default({}),
});

const defaultValues = {
  name: "",
  driver: "local",
  driver_opts: {},
  labels: {},
};

interface CreateStorageFormProps {
  onSubmit: (data: z.infer<typeof schema>) => Promise<void>;
  onCancel: () => void;
}

export function CreateStorageForm({ onSubmit, onCancel }: CreateStorageFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error(`Failed to create volume: ${error}`);
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
  };

  const handleTabChange = (id: string) => {
    if (form.getValues('name')) {
      setActiveTab(id);
    }
  };

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs */}
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

        {/* Main Form Area */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form
                id="create-storage-form"
                className="space-y-6"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <div className="space-y-6">
                  <CurrentStepComponent {...sectionProps} />
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
            form="create-storage-form"
            disabled={!form.getValues("name")}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Create Volume
          </Button>
        </div>
      </div>
    </div>
  );
} 
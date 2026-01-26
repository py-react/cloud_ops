import React, { useState } from 'react';
import * as z from 'zod';
import { HardDrive, Sliders } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { BasicConfig } from './sections/BasicConfig';
import { AdvancedConfig } from './sections/AdvancedConfig';

const steps = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: HardDrive,
    description: 'Core volume settings',
    longDescription: 'Every Docker volume needs a name and can optionally specify a driver. The default driver is "local", which stores the volume data on the host filesystem.',
    component: BasicConfig,
    canNavigateNext: (form: any) => {
      const name = form.watch('name');
      return {
        can: !!name,
        message: "Volume name is required to proceed"
      };
    }
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Sliders,
    description: 'Driver options and labels',
    longDescription: 'Driver options allow you to configure specific settings for the volume driver. Labels are key-value pairs that can be used to organize and categorize your volumes.',
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
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

export function CreateStorageForm({ onSubmit, onCancel, isWizardOpen, setIsWizardOpen }: CreateStorageFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  return (
    <FormWizard
      name="create-storage-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps}
      schema={schema as z.ZodSchema<any>}
      initialValues={defaultValues}
      onSubmit={onSubmit as any}
      submitLabel="Create Volume"
      submitIcon={HardDrive}
      heading={{
        primary: "Create Docker Volume",
        secondary: "Configure storage for your containers",
        icon: HardDrive,
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
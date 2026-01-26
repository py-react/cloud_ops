import React, { useState } from 'react';
import * as z from "zod";
import { ArrowDownToLineIcon } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { FormWizard } from '@/components/wizard/form-wizard';

const schema = z.object({
  image: z.string().min(1, "Image name is required"),
  registry: z.string().optional(),
});

const defaultValues = {
  image: "",
  registry: "docker.io",
};

interface PackageRunnerFormProps {
  onSubmitHandler: (data: { image: string; registry?: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

const SourceSection = ({ control }: any) => (
  <div className="space-y-6">
    <FormField
      control={control}
      name="image"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-foreground/80">Image Name <span className="text-red-500">*</span></FormLabel>
          <FormDescription className="text-xs">
            The name of the Docker image to pull (e.g., nginx:latest)
          </FormDescription>
          <FormControl>
            <Input placeholder="e.g., nginx:latest" className="h-9 rounded-lg" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="registry"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-foreground/80">Registry (Optional)</FormLabel>
          <FormDescription className="text-xs">
            The registry to pull from (e.g., docker.io)
          </FormDescription>
          <FormControl>
            <Input placeholder="e.g., docker.io" className="h-9 rounded-lg" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const steps = [
  {
    id: 'source',
    label: 'Image Source',
    icon: ArrowDownToLineIcon,
    description: 'Registry and image',
    longDescription: 'To pull a package, you need to provide the image name (e.g., "nginx:latest"). If the image is hosted on a custom registry, you can specify it as well.',
    component: SourceSection,
    canNavigateNext: (form: any) => {
      const image = form.watch('image');
      return { can: !!image, message: "Image name is required" };
    }
  }
];

interface PackageRunnerFormProps {
  onSubmitHandler: (data: { image: string; registry?: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

export function PackageRunnerForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
  isWizardOpen,
  setIsWizardOpen,
}: PackageRunnerFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      if (submitting) return;
      await onSubmitHandler(data);
    } catch (error) {
    }
  };

  return (
    <FormWizard
      name="pull-package-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps as any}
      schema={schema as any}
      initialValues={defaultValues}
      onSubmit={onSubmit as any}
      submitLabel="Pull Package"
      submitIcon={ArrowDownToLineIcon}
      heading={{
        primary: "Pull Package",
        secondary: "Download a Docker image from a registry",
        icon: ArrowDownToLineIcon,
      }}
    />
  );
}

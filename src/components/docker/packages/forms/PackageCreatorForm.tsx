import React, { useState } from 'react';
import * as z from "zod";
import { toast } from 'sonner';
import { ContainerIcon, FileText, Tag } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import MonacoEditor from '@monaco-editor/react';
import { FormWizard } from '@/components/wizard/form-wizard';

const schema = z.object({
  content: z.string().min(1, 'Dockerfile content is required'),
  tag: z.string().min(1, 'Tag is required'),
});

const defaultValues = {
  content: '# Write your Packagefile here\nFROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
  tag: '',
};

const EditorSection = ({ control }: any) => (
  <FormField
    control={control}
    name="content"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm font-medium text-foreground/80">Dockerfile Content</FormLabel>
        <FormControl>
          <div className="rounded-xl border border-border/40 overflow-hidden bg-background shadow-sm ring-1 ring-border/5">
            <MonacoEditor
              height="400px"
              language="dockerfile"
              theme="vs-light"
              value={field.value}
              onChange={(val) => field.onChange(val || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 2,
                padding: { top: 12, bottom: 12 },
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const MetadataSection = ({ control }: any) => (
  <FormField
    control={control}
    name="tag"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm font-medium text-foreground/80">Package Tag <span className="text-red-500">*</span></FormLabel>
        <FormDescription className="text-xs">
          Identify your image (e.g., nginx:latest or myapp:v1)
        </FormDescription>
        <FormControl>
          <Input placeholder="e.g., nginx:latest" className="h-9 rounded-lg" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const steps = [
  {
    id: 'editor',
    label: 'Packagefile',
    icon: FileText,
    description: 'Build instructions',
    longDescription: 'Define your package using standard Dockerfile syntax. This file tells the engine how to build your environment layer by layer.',
    component: EditorSection,
    canNavigateNext: (form: any) => {
      const content = form.watch('content');
      return { can: !!content, message: "Dockerfile content is required" };
    }
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: Tag,
    description: 'Naming and tags',
    longDescription: 'Give your package a name and tag to identify it in your local repository. For example, "my-app:v1.0".',
    component: MetadataSection,
  }
];

interface PackageCreatorFormProps {
  onSubmitHandler: (data: { content: string; tag: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

export function PackageCreatorForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
  isWizardOpen,
  setIsWizardOpen,
}: PackageCreatorFormProps) {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      if (submitting) return;
      await onSubmitHandler(data);
    } catch (error) {
      toast.error(`Failed to create package: ${error}`);
    }
  };

  return (
    <FormWizard
      name="create-package-form"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps as any}
      schema={schema as any}
      initialValues={defaultValues}
      onSubmit={onSubmit as any}
      submitLabel="Create Package"
      submitIcon={ContainerIcon}
      heading={{
        primary: "Create New Package",
        secondary: "Build a new Docker image from a Containerfile",
        icon: ContainerIcon,
      }}
    />
  );
}

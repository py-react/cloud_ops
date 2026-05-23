import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  Upload,
} from "lucide-react";
import * as z from "zod";
import { toast } from "sonner";
import FormWizard from "@/components/wizard/form-wizard";
import { UploadConfigStep } from "./forms/UploadConfigStep";

const uploadConfigSchema = z.object({
  name: z.string().min(1, "Nickname is required"),
  content: z.string().optional(),
  is_system: z.boolean().default(false),
  system_path: z.string().optional(),
}).refine(data => {
  if (!data.is_system && !data.content) return false;
  if (data.is_system && !data.system_path) return false;
  return true;
}, {
  message: "Configuration content or system path is required",
  path: ["content"]
});

type UploadConfigFormValues = z.infer<typeof uploadConfigSchema>;

const steps = [
  {
    id: 'upload',
    label: 'Config Source',
    icon: Upload,
    description: 'Select upload or system path.',
    longDescription: 'Choose whether to upload a Kubeconfig file or point to a specific file path on the server\'s filesystem.',
    component: UploadConfigStep
  }
];

export const UploadConfigWizard = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(steps[0].id);

  const onSubmit = async (data: UploadConfigFormValues) => {
    try {
      const response = await fetch('/api/kubernertes/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          name: data.name,
          content: data.content,
          is_system: data.is_system,
          system_path: data.system_path
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add config');
      }

      const responseData = await response.json();

      setIsWizardOpen(false);
      toast.success(`Successfully added Kubeconfig "${data.name}"`);
      onUploadSuccess();

      if (responseData.is_active) {
        toast.info("Initializing platform with new cluster data...");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add config");
    }
  };

  return (
    <>
      <Button onClick={() => setIsWizardOpen(true)} className="gap-2 shadow-sm">
        <Plus size={18} />
        Add New Kubeconfig
      </Button>

      <FormWizard
        name="upload-kubeconfig"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={steps}
        schema={uploadConfigSchema as z.ZodSchema<any>}
        initialValues={{
          name: "",
          content: "",
          is_system: false,
          system_path: "",
        }}
        onSubmit={onSubmit}
        submitLabel="Add Kubeconfig"
        submitIcon={Plus}
        heading={{
          primary: "Add Kubeconfig",
          secondary: "Securely store and encrypt a new cluster configuration",
          icon: FileText,
        }}
      />
    </>
  );
};

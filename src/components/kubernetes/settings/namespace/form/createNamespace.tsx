import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  Plus,
} from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import * as z from "zod";
import { toast } from "sonner";
import { DefaultService } from "@/gingerJs_api_client";
import { NamespaceContext } from "../../../contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";

// Form validation schema
const createNameSchema = z.object({
  name: z.string().min(1, "Namespace name is required").regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, "Namespace name must be DNS-compliant (lowercase, numbers, and hyphens)"),
});

type CreateNamespaceFormValues = z.infer<typeof createNameSchema>;

const BasicsStep = ({ control }: any) => (
  <div className="grid grid-cols-1 gap-6">
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Namespace Name <RequiredBadge />
          </FormLabel>
          <FormDescription>
            A unique name to identify this Kubernetes namespace in current context
          </FormDescription>
          <FormControl>
            <Input placeholder="dev-team" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

// Helper to indicate required fields
const RequiredBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
    Required
  </span>
);

const steps = [
  {
    id: 'basics',
    label: 'Basic Info',
    description: 'Namespace configuration',
    longDescription: 'Enter a unique name for your Kubernetes namespace. This name will be used to identify the namespace within your cluster. Namespace names must be DNS-compliant.',
    component: BasicsStep,
  }
];

export const CreateNamespace = () => {
  const { fetchNamespaces } = useContext(NamespaceContext);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(steps[0].id);

  const onSubmit = async (values: CreateNamespaceFormValues) => {
    try {
      await DefaultService.apiKubernertesClusterNamespacePost({
        requestBody: { name: values.name },
      });
      toast.success(`Successfully created namespace "${values.name}"`);
      fetchNamespaces();
      setIsWizardOpen(false);
    } catch (err) {
      toast.error(err as string);
    }
  };

  return (
    <>
      <Button onClick={() => setIsWizardOpen(true)} className="gap-1">
        <Plus size={18} />
        Create Namespace
      </Button>

      <FormWizard
        name="create-namespace"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={steps}
        schema={createNameSchema as z.ZodSchema<any>}
        initialValues={{ name: "" }}
        onSubmit={onSubmit}
        submitLabel="Create Namespace"
        submitIcon={Plus}
        heading={{
          primary: "Create Kubernetes Namespace",
          secondary: "Define a new isolated environment within your cluster",
          icon: Folder,
        }}
      />
    </>
  );
};

export default CreateNamespace;

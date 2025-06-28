import React, { useState } from "react";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ResourceEditor from "@/components/resource-form/sections/resource-editor";
import FormWizard, { IFormWizard } from "@/components/wizard/form-wizard";
import * as z from "zod";

// Define schema for resource quota settings
export const schema = z.object({
  rawYaml: z
    .string({
      required_error: "Please provide YAML configuration!",
      message: "Invalid YAML configuration",
    })
    .min(10, "Invalid YAML configuration"),
});

export type SchemaValues = z.infer<typeof schema>;

export interface IResourceForm {
  editDetails: boolean;
  rawYaml: string;
  onClose: () => void;
  onUpdate: (data: any) => void;
  resourceType: string;
  heading:string,
  description?:string,
}

const ResourceForm: React.FC<IResourceForm> = ({
  editDetails,
  rawYaml,
  onClose,
  onUpdate,
  resourceType,
  heading:headingText,
  description,
}) => {
  const [currentStep, setCurrentStep] = useState("create");
  // Use the utility function to extract form values from quotas
  const form = useForm<SchemaValues>({
    resolver: zodResolver(schema),
    defaultValues: { rawYaml },
    reValidateMode: "onChange",
  });

  const onSubmit = (data: SchemaValues) => {
    try {
      onUpdate({
        rawYaml: data.rawYaml,
      });
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const steps = [
    {
      id: "create",
      label: rawYaml ? "Update" : "Create",
      description: "",
      longDescription:
        description || "Define resource deployment using YAML configuration.",
      component: ResourceEditor,
    },
  ];

  const heading = {
    primary: headingText,
    icon: Settings,
  };

  const wizardProps: IFormWizard<SchemaValues> = {
    isWizardOpen: !!editDetails,
    setIsWizardOpen: (isOpen) => !isOpen && onClose(),
    steps,
    heading,
    currentStep,
    setCurrentStep,
    initialValues: form.getValues(),
    schema: schema,
    onSubmit: onSubmit,
    name: `${resourceType}-form`,
  };

  return <FormWizard {...wizardProps} />;
};

export default ResourceForm;

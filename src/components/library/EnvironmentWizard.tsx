import React from 'react';
import { Globe } from 'lucide-react';
import { FormWizard } from "@/components/wizard/form-wizard";
import * as z from 'zod';
import { getEnvironmentConfigSteps } from './forms/EnvironmentConfigSteps';

interface EnvironmentWizardProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    templateName: string;
    initialValues: { env_name: string; values: string };
    onSubmit: (data: any) => Promise<void>;
    selectedNamespace: string;
    isEditing?: boolean;
}

const envSchema = z.object({
    env_name: z.string()
        .min(1, "Environment name is required")
        .refine((val) => !['chart', 'values'].includes(val.toLowerCase()), {
            message: "Environment name cannot be 'Chart' or 'values' (reserved names)"
        }),
    values: z.string(),
});

export const EnvironmentWizard: React.FC<EnvironmentWizardProps> = ({ 
    isOpen, 
    setIsOpen, 
    templateName, 
    initialValues, 
    onSubmit,
    selectedNamespace,
    isEditing = false,
}) => {
    const [currentStep, setCurrentStep] = React.useState('basic');
    const steps = getEnvironmentConfigSteps({ isEditing });

    return (
        <FormWizard
            isWizardOpen={isOpen}
            setIsWizardOpen={setIsOpen}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            initialValues={initialValues}
            name="env-config-wizard"
            heading={{
                primary: isEditing ? `Edit: ${initialValues.env_name}` : "Add Environment",
                secondary: `Value overrides for ${templateName}`,
                icon: Globe
            }}
            schema={envSchema}
            onSubmit={onSubmit}
            submitLabel="Save Configuration"
        />
    );
};

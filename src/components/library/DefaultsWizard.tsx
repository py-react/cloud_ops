import React from 'react';
import { Settings } from 'lucide-react';
import { FormWizard } from "@/components/wizard/form-wizard";
import * as z from 'zod';
import { getDefaultsSteps } from './forms/DefaultsSteps';

interface DefaultsWizardProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    chartName: string;
    initialContent?: string;
    onSubmit: (data: { content: string; commit_message?: string }) => Promise<void>;
}

const defaultsSchema = z.object({
    content: z.string(),
});

export const DefaultsWizard: React.FC<DefaultsWizardProps> = ({
    isOpen,
    setIsOpen,
    chartName,
    initialContent = '',
    onSubmit,
}) => {
    const [currentStep, setCurrentStep] = React.useState('defaults');
    const steps = getDefaultsSteps();

    return (
        <FormWizard
            isWizardOpen={isOpen}
            setIsWizardOpen={setIsOpen}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            initialValues={{ content: initialContent }}
            name="defaults-wizard"
            heading={{
                primary: 'Default Values',
                secondary: `values.yaml for ${chartName}`,
                icon: Settings,
            }}
            schema={defaultsSchema}
            onSubmit={onSubmit}
            submitLabel="Save Defaults"
        />
    );
};

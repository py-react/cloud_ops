import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { FormWizard } from "@/components/wizard/form-wizard";
import * as z from 'zod';
import { getManifestSteps } from './forms/ManifestSteps';

interface ManifestWizardProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    chartName: string;
    initialContent?: string;
    onSubmit: (data: { content: string; commit_message?: string }) => Promise<void>;
}

const manifestSchema = z.object({
    content: z.string(),
});

export const ManifestWizard: React.FC<ManifestWizardProps> = ({
    isOpen,
    setIsOpen,
    chartName,
    initialContent = '',
    onSubmit,
}) => {
    const [currentStep, setCurrentStep] = React.useState('manifest');
    const steps = getManifestSteps();

    return (
        <FormWizard
            isWizardOpen={isOpen}
            setIsWizardOpen={setIsOpen}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            initialValues={{ content: initialContent }}
            name="manifest-wizard"
            heading={{
                primary: 'K8s Manifest',
                secondary: `templates/app.yaml for ${chartName}`,
                icon: LayoutTemplate,
            }}
            schema={manifestSchema}
            onSubmit={onSubmit}
            submitLabel="Save Manifest"
        />
    );
};

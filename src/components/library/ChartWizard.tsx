import React from 'react';
import { Package } from 'lucide-react';
import { FormWizard } from "@/components/wizard/form-wizard";
import * as z from 'zod';
import { getChartSteps } from './forms/ChartSteps';

interface ChartWizardProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    isEditing?: boolean;
    initialValues?: {
        name: string;
        description: string;
        version: string;
        appVersion: string;
    };
}

const chartSchema = z.object({
    name: z.string()
        .min(1, 'Chart name is required')
        .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
    description: z.string().optional().default(''),
    version: z.string().default('0.1.0'),
    appVersion: z.string().default('latest'),
});

export const ChartWizard: React.FC<ChartWizardProps> = ({
    isOpen,
    setIsOpen,
    onSubmit,
    isEditing = false,
    initialValues,
}) => {
    const [currentStep, setCurrentStep] = React.useState('info');
    const steps = getChartSteps({ isEditing });

    return (
        <FormWizard
            isWizardOpen={isOpen}
            setIsWizardOpen={setIsOpen}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            initialValues={initialValues || { name: '', description: '', version: '0.1.0', appVersion: 'latest' }}
            name="chart-wizard"
            heading={{
                primary: isEditing ? `Edit: ${initialValues?.name}` : 'New Chart',
                secondary: isEditing ? 'Update chart metadata' : 'Create a new Helm chart blueprint',
                icon: Package,
            }}
            schema={chartSchema}
            onSubmit={onSubmit}
            submitLabel={isEditing ? 'Save Changes' : 'Create Chart'}
        />
    );
};

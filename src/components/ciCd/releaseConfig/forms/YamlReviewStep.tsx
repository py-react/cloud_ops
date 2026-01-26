import React, { useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData, releaseFormSchema } from "./components/formUtils";
import { formToYaml, parseYaml, mergeFormAndYaml, yamlToForm } from "./yaml/yamlUtils";
import { validateKubernetesSpec } from "./yaml/kubernetesSchema";
import YamlEditor from "./yaml/YamlEditor";
import { AlertCircle } from "lucide-react";

interface YamlReviewStepProps {
    form: UseFormReturn<DeploymentFormData>;
}

const YamlReviewStep: React.FC<YamlReviewStepProps> = ({ form }) => {
    const [yamlContent, setYamlContent] = useState(() => formToYaml(form.getValues()));
    const [validationError, setValidationError] = useState<string | null>(null);

    // Sync wizard form -> YAML editor
    useEffect(() => {
        const subscription = form.watch((values) => {
            setYamlContent(formToYaml(values as DeploymentFormData));
            setValidationError(null);
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // Sync YAML editor -> wizard form
    const handleYamlChange = useCallback((yaml: string) => {
        setYamlContent(yaml);
        const parsed = parseYaml(yaml);

        if (!parsed.valid) {
            setValidationError(parsed.error || "Invalid YAML syntax");
            return;
        }

        const validationResult = validateKubernetesSpec(parsed.data);
        if (!validationResult.valid) {
            const errorMessages = validationResult.errors.slice(0, 3).map(e => `${e.path}: ${e.message}`).join('; ');
            setValidationError(errorMessages);
            return;
        }

        // Convert the raw K8s manifest to the form-structured data
        const formDataFromYaml = yamlToForm(yaml);
        const currentFormValues = form.getValues();
        const merged = mergeFormAndYaml(currentFormValues, formDataFromYaml);

        // Validate the merged result against our Zod schema
        const zodResult = releaseFormSchema.safeParse(merged);
        if (!zodResult.success) {
            const firstError = zodResult.error.errors[0];
            const path = firstError.path.join('.');
            setValidationError(`${path ? path + ': ' : ''}${firstError.message}`);
            return;
        }

        setValidationError(null);
        form.reset(merged);
    }, [form]);

    return (
        <div className="flex flex-col gap-4 h-[450px]">
            {validationError && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs font-medium text-destructive truncate">
                        {validationError}
                    </p>
                </div>
            )}
            <div className="flex-1 rounded-xl overflow-hidden border border-border/50 bg-[#1e1e1e]">
                <YamlEditor yaml={yamlContent} onChange={handleYamlChange} />
            </div>
        </div>
    );
};

export default YamlReviewStep;

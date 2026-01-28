import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { DeploymentForm, DeploymentAdvancedConfig } from "@/components/ciCd/library/deployment/forms/DeploymentForm";
import { DeploymentList } from "@/components/ciCd/library/deployment/DeploymentList";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import PageLayout from "@/components/PageLayout";

const deploymentSchema = z.object({
    name: z.string().min(1, "Deployment name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    replicas: z.number().default(1),
    selector_id: z.number().min(1, "Selector is required"),
    pod_id: z.number().min(1, "Pod template is required"),
    min_ready_seconds: z.number().nullable().optional(),
    revision_history_limit: z.number().nullable().optional(),
    progress_deadline_seconds: z.number().nullable().optional(),
    paused: z.boolean().default(false),
    dynamic_attr: z.any().optional(),
});

const parseJson = (data: any, defaultValue: any = {}) => {
    if (!data) return defaultValue;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            return defaultValue;
        }
    }
    return data;
};

const transformDeployment = (row: any) => ({
    name: row.name,
    namespace: row.namespace,
    replicas: row.replicas ?? 1,
    selector_id: row.selector_id,
    pod_id: row.pod_id,
    min_ready_seconds: row.min_ready_seconds ?? undefined,
    revision_history_limit: row.revision_history_limit ?? undefined,
    progress_deadline_seconds: row.progress_deadline_seconds ?? undefined,
    paused: row.paused ?? false,
    dynamic_attr: parseJson(row.dynamic_attr, {}),
});


const _default_value = {
    name: "",
    namespace: "",
    replicas: 1,
    selector_id: undefined,
    pod_id: undefined,
    paused: false,
    dynamic_attr: {},
}

function DerivedDeployment() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deployments, setDeployments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("setup");
    const [initialValues, setInitialValues] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewInitialValues, setViewInitialValues] = useState<any>(null);
    const [viewStep, setViewStep] = useState("view");
    const [conflictDialog, setConflictDialog] = useState<{
        isOpen: boolean;
        resourceName: string;
        resourceType: string;
        dependents: any[];
    }>({
        isOpen: false,
        resourceName: "",
        resourceType: "",
        dependents: []
    });

    const { highlightedId, resourceType, focusId, autoOpen, clearFocus } = useResourceLink();

    const [default_value] = useState({ ..._default_value, namespace: selectedNamespace })

    useEffect(() => {
        fetchDeployments();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType || deployments.length === 0) return;

        if (resourceType === "deployment") {
            const deployment = deployments.find(d => String(d.id) === String(focusId));
            if (deployment) {
                handleViewDetails(deployment);
            }
        }
    }, [autoOpen, focusId, resourceType, deployments]);

    const fetchDeployments = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryDeploymentGet({ namespace: selectedNamespace });
            setDeployments(data as any[]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editMode && editingId) {
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentPut({ id: editingId, requestBody: values } as any);
                toast.success(`Updated ${values.name}`);
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentPost({ requestBody: values } as any);
                toast.success(`Created ${values.name}`);
            }
            setDialogOpen(false);
            fetchDeployments();
        } catch (error: any) {
            console.error("Submit error:", error);
            const detail = error.body?.detail || error.message || "Unknown error";
            toast.error(editMode ? `Update failed: ${detail}` : `Creation failed: ${detail}`);
        }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryDeploymentDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchDeployments();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Derived Deployment",
                    dependents: dependents
                });
            } else {
                toast.error(`Error deleting deployment ${row.name}`);
            }
        }
    };

    const deploymentSteps = useMemo(() => [
        {
            id: 'setup',
            label: 'Setup Deployment',
            description: 'Configure Deployment',
            longDescription: 'Configure the deployment name, replicas, and link selectors and pods.',
            component: (props: any) => <DeploymentForm {...props} namespace={selectedNamespace} />,
        },
        {
            id: 'advanced',
            label: 'View Config',
            description: 'Advanced Configuration',
            longDescription: 'Fine-tune your deployment configuration in YAML format. Attributes are read-only.',
            component: (props: any) => <DeploymentAdvancedConfig {...props} namespace={selectedNamespace} />,
        },
    ], [selectedNamespace]);

    const deploymentViewSteps = useMemo(() => [
        {
            id: 'view',
            label: 'View Deployment',
            description: 'View Deployment Details',
            longDescription: 'Review the generated YAML and configuration for your deployment.',
            component: (props: any) => <DeploymentAdvancedConfig {...props} namespace={selectedNamespace} />,
            hideSectionHeader: true,
        },
    ], [selectedNamespace]);

    const handleEdit = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
        setInitialValues(transformDeployment(row));
        setActiveTab("setup");
        setDialogOpen(true);
    };

    const handleViewDetails = (row: any) => {
        setViewInitialValues(transformDeployment(row));
        setViewDialogOpen(true);
    };

    return (
        <PageLayout
            title="Derived Deployments"
            subtitle={
                <>
                    Manage composed deployment configurations in <span className="text-primary font-bold">{selectedNamespace}</span>.
                </>
            }
            icon={Layers}
            actions={
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={fetchDeployments}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setActiveTab("setup");
                        setInitialValues(default_value);
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Derived Deployment
                    </Button>
                </div>
            }
        >
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Deployments"
                    count={deployments.length}
                    icon={<Layers className="w-4 h-4" />}
                    color="bg-purple-500"
                    className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <DeploymentList
                deployments={deployments}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                highlightedId={resourceType === 'deployment' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="deployment-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={deploymentSteps}
                schema={deploymentSchema}
                initialValues={initialValues || default_value}
                onSubmit={handleSubmit}
                submitLabel={editMode ? "Update Deployment" : "Create Deployment"}
                submitIcon={Layers}
                heading={{
                    primary: editMode ? "Edit Derived Deployment" : "Create Derived Deployment",
                    secondary: editMode ? "Update composed deployment configuration" : "Define a new deployment by linking pod templates and selecting selectors",
                    icon: Layers,
                }}
            />

            <FormWizard
                name="view-deployment-details"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep={viewStep}
                setCurrentStep={setViewStep}
                steps={deploymentViewSteps}
                schema={deploymentSchema}
                initialValues={viewInitialValues}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Layers}
                heading={{
                    primary: "Derived Deployment Details",
                    secondary: "View generated YAML and configuration",
                    icon: Layers,
                }}
                hideActions={true}
            />

            <DeleteDependencyDialog
                isOpen={conflictDialog.isOpen}
                onClose={() => setConflictDialog(prev => ({ ...prev, isOpen: false }))}
                resourceName={conflictDialog.resourceName}
                resourceType={conflictDialog.resourceType}
                dependents={conflictDialog.dependents}
            />
        </PageLayout>
    );
}

export default DerivedDeployment;

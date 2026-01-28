import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Layout } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { SelectorBasicConfig } from "@/components/ciCd/library/deployment/forms/DeploymentSelectorForm";
import { DeploymentSelectorList } from "@/components/ciCd/library/deployment/DeploymentSelectorList";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import PageLayout from "@/components/PageLayout";

const schema = z.object({
    name: z.string().min(1, "Selector name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.string().optional(),
});

const steps = [
    {
        id: 'add-selector',
        label: 'Add Selector',
        description: 'Create Configuration',
        longDescription: 'Configure the label selector name and JSON configuration.',
        component: SelectorBasicConfig,
    }
]

const _default_value = {
    name: "",
    namespace: "",
    config: "",
}

function DeploymentSelector() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("add-selector");
    const [viewProfileInitialValues, setViewProfileInitialValues] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // View details state
    const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
    const [viewProfileStep, setViewProfileStep] = useState("view");

    // Conflict/Dependency state
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
        fetchProfiles();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "deployment_selector" && profiles.length > 0) {
            const profile = profiles.find(p => p.id == focusId);
            if (profile) handleViewProfile(profile);
        }
    }, [autoOpen, focusId, resourceType, profiles]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryDeploymentSelectorGet({ namespace: selectedNamespace });
            setProfiles(data as any[]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        const payload = {
            ...values,
            config: values.config ? JSON.parse(values.config) : {},
        };
        try {
            if (editMode && editingId) {
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentSelectorPut({ id: editingId, requestBody: payload } as any);
                toast.success("Selector updated");
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentSelectorPost({ requestBody: payload } as any);
                toast.success("Selector created");
            }
            setDialogOpen(false);
            fetchProfiles();
        } catch (error) {
            toast.error(editMode ? "Error updating selector" : "Error saving selector");
        }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryDeploymentSelectorDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Deployment Selector",
                    dependents: dependents
                });
            } else {
                toast.error(`Unable to delete ${row.name}`);
            }
        }
    };

    const handleViewProfile = (row: any) => {
        setViewProfileInitialValues(row);
        setViewProfileStep("view");
        setViewProfileDialogOpen(true);
    };

    const handleEditProfile = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
        setActiveTab("add-selector");
        const profileToEdit = { ...row };
        if (typeof profileToEdit.config !== 'string') {
            profileToEdit.config = JSON.stringify(profileToEdit.config, null, 2);
        }
        setViewProfileInitialValues(profileToEdit);
        setDialogOpen(true);
    };

    return (
        <PageLayout
            title="Deployment Selectors"
            subtitle={
                <>
                    Manage reusable deployment label selectors in <span className="text-primary font-bold">{selectedNamespace}</span>.
                </>
            }
            icon={Layout}
            actions={
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={fetchProfiles}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        onClick={() => {
                            setEditMode(false);
                            setEditingId(null);
                            setActiveTab("add-selector");
                            setViewProfileInitialValues(default_value);
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Selector
                    </Button>
                </div>
            }
        >
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Selectors"
                    count={profiles.length}
                    icon={<Layout className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <DeploymentSelectorList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDelete}
                onViewDetails={handleViewProfile}
                onEdit={handleEditProfile}
                highlightedId={resourceType === 'deployment_selector' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="deployment-selector-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={schema as z.ZodSchema<any>}
                initialValues={viewProfileInitialValues || default_value}
                onSubmit={handleSubmit}
                submitLabel={editMode ? "Update Selector" : "Create Selector"}
                submitIcon={Plus}
                heading={{
                    primary: editMode ? "Edit Selector" : "Manage Selectors",
                    secondary: editMode ? "Update label selector specification" : "Add new selectors, view existing selectors, and manage specifications",
                    icon: Layout,
                }}
            />

            <FormWizard
                name="view-selector-details"
                isWizardOpen={viewProfileDialogOpen}
                setIsWizardOpen={setViewProfileDialogOpen}
                currentStep={viewProfileStep}
                setCurrentStep={setViewProfileStep}
                steps={[{
                    id: 'view',
                    label: 'View Selector',
                    description: 'View Selector Details',
                    longDescription: 'View the details of the selected selector profile.',
                    component: (props: any) => viewProfileInitialValues ? (
                        <ProfileAdvancedConfig profile={viewProfileInitialValues} profileType="deployment_selector" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={schema}
                initialValues={viewProfileInitialValues || default_value}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Layout}
                heading={{
                    primary: "Selector Details",
                    secondary: "View selector configuration and YAML",
                    icon: Layout,
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

export default DeploymentSelector;

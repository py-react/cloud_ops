import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { ProfileBasicConfig } from "@/components/ciCd/library/deployment/forms/DeploymentProfileForm";
import { DeploymentProfileList } from "@/components/ciCd/library/deployment/DeploymentProfileList";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";

const schema = z.object({
    name: z.string().min(1, "Profile name is required"),
    type: z.string().min(1, "Profile type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.string().optional(),
});

const steps = [
    {
        id: 'add-profile',
        label: 'Add Profile',
        description: 'Create Configuration',
        longDescription: 'Configure the profile name, type, and JSON configuration.',
        component: ProfileBasicConfig,
    }
]

const _default_value = {
    name: "",
    namespace: "",
    type: "",
    config: "",
}

function DeploymentProfile() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("add-profile");
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
        if (resourceType === "deployment_profile" && profiles.length > 0) {
            const profile = profiles.find(p => p.id == focusId);
            if (profile) handleViewProfile(profile);
        }
    }, [autoOpen, focusId, resourceType, profiles]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryDeploymentProfileGet({ namespace: selectedNamespace });
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
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentProfilePut({ id: editingId, requestBody: payload } as any);
                toast.success("Profile updated");
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryDeploymentProfilePost({ requestBody: payload } as any);
                toast.success("Profile created");
            }
            setDialogOpen(false);
            fetchProfiles();
        } catch (error) {
            toast.error(editMode ? "Error updating profile" : "Error saving profile");
        }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryDeploymentProfileDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Deployment Specification",
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
        setActiveTab("add-profile");
        const profileToEdit = { ...row };
        if (typeof profileToEdit.config !== 'string') {
            profileToEdit.config = JSON.stringify(profileToEdit.config, null, 2);
        }
        setViewProfileInitialValues(profileToEdit);
        setDialogOpen(true);
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Deployment Specifications</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Manage reusable deployment specifications in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
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
                            setActiveTab("add-profile");
                            setViewProfileInitialValues(default_value);
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Specification
                    </Button>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Specifications"
                    count={profiles.length}
                    icon={<Settings className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <DeploymentProfileList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDelete}
                onViewDetails={handleViewProfile}
                onEdit={handleEditProfile}
                highlightedId={resourceType === 'deployment_profile' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="deployment-profile-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={schema as z.ZodSchema<any>}
                initialValues={viewProfileInitialValues || default_value}
                onSubmit={handleSubmit}
                submitLabel={editMode ? "Update Specification" : "Create Specification"}
                submitIcon={Plus}
                heading={{
                    primary: editMode ? "Edit Specification" : "Manage Specifications",
                    secondary: editMode ? "Update deployment configuration profile" : "Add new specifications, view existing specifications, and manage configurations",
                    icon: Settings,
                }}
            />

            <FormWizard
                name="view-profile-details"
                isWizardOpen={viewProfileDialogOpen}
                setIsWizardOpen={setViewProfileDialogOpen}
                currentStep={viewProfileStep}
                setCurrentStep={setViewProfileStep}
                steps={[{
                    id: 'view',
                    label: 'View Profile',
                    description: 'View Profile Details',
                    longDescription: 'View the details of the selected deployment specification.',
                    component: (props: any) => viewProfileInitialValues ? (
                        <ProfileAdvancedConfig profile={viewProfileInitialValues} profileType="deployment_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={schema}
                initialValues={viewProfileInitialValues || default_value}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Settings}
                heading={{
                    primary: "Specification Details",
                    secondary: "View specification configuration and YAML",
                    icon: Settings,
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
        </div>
    );
}

export default DeploymentProfile;

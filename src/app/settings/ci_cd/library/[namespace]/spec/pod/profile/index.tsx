import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { PodProfileForm } from "@/components/ciCd/library/podSpec/forms/PodProfileForm";
import { ViewProfileList } from "@/components/ciCd/library/podSpec/forms/ViewProfileList";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

const steps = [
    {
        id: 'config',
        label: 'Add Profile',
        description: 'Create Configuration',
        longDescription: 'Configure the profile name, type, and JSON configuration.',
        component: PodProfileForm,
    }
];

function PodProfiles() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
    const [profileStep, setProfileStep] = useState("config");
    const [viewProfileStep, setViewProfileStep] = useState("view");
    const [podProfiles, setPodProfiles] = useState<any[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [viewProfileInitialValues, setViewProfileInitialValues] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

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

    useEffect(() => {
        fetchPodProfiles();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "pod_profile" && podProfiles.length > 0) {
            const profile = podProfiles.find(p => p.id == focusId);
            if (profile) {
                setViewProfileInitialValues(profile);
                setViewProfileStep("view");
                setViewProfileDialogOpen(true);
            }
        }
    }, [autoOpen, focusId, resourceType, podProfiles]);

    const fetchPodProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryPodProfileGet({ namespace: selectedNamespace });
            setPodProfiles(data as any[]);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const handleSubmitProfile = async (values: any) => {
        try {
            if (editMode && editingId) {
                await DefaultService.apiIntegrationKubernetesLibraryPodProfilePut({ id: editingId, requestBody: values } as any);
                toast.success("Pod profile updated");
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryPodProfilePost({ requestBody: values });
                toast.success("Pod profile created");
            }
            setProfileDialogOpen(false);
            fetchPodProfiles();
        } catch (error) {
            toast.error(editMode ? "Error updating pod profile" : "Error creating pod profile");
        }
    };

    const handleDeleteProfile = async (row: any, dependents?: any[]) => {
        if (dependents && dependents.length > 0) {
            setConflictDialog({
                isOpen: true,
                resourceName: row.name,
                resourceType: "Pod Profile",
                dependents: dependents
            });
        } else {
            fetchPodProfiles();
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
        setProfileStep("config");
        setViewProfileInitialValues(row);
        setProfileDialogOpen(true);
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
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Pod Profiles</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Manage reusable pod configuration profiles in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={fetchPodProfiles}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        onClick={() => {
                            setEditMode(false);
                            setEditingId(null);
                            setProfileStep("config");
                            setViewProfileInitialValues({ name: "", type: "", namespace: selectedNamespace, config: "" });
                            setProfileDialogOpen(true);
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Profile
                    </Button>
                </div>
            </div>
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Pod Profiles"
                    count={podProfiles.length}
                    icon={<Settings className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loadingProfiles}
                />
            </div>

            <ViewProfileList
                profiles={podProfiles}
                loading={loadingProfiles}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeleteProfile}
                onViewDetails={handleViewProfile}
                onEdit={handleEditProfile}
                type="pod_profile"
                highlightedId={resourceType === 'pod_profile' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="create-pod-profile"
                isWizardOpen={profileDialogOpen}
                setIsWizardOpen={setProfileDialogOpen}
                currentStep={profileStep}
                setCurrentStep={setProfileStep}
                steps={steps}
                schema={profileSchema}
                initialValues={viewProfileInitialValues}
                onSubmit={handleSubmitProfile}
                submitLabel={editMode ? "Update Profile" : "Create Profile"}
                submitIcon={Settings}
                heading={{
                    primary: editMode ? "Edit Pod Profile" : "Manage Pod Profiles",
                    secondary: editMode ? "Update reusable pod profile configuration" : "Create and configure reusable pod profiles",
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
                    longDescription: 'View the details of the selected profile.',
                    component: (props: any) => viewProfileInitialValues ? (
                        <ProfileAdvancedConfig profile={viewProfileInitialValues} profileType="pod_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={profileSchema}
                initialValues={viewProfileInitialValues || { name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Settings}
                heading={{
                    primary: "Pod Profile Details",
                    secondary: "View profile configuration and YAML",
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

export default PodProfiles;

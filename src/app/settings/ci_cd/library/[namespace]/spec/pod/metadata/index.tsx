import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Layout, Plus, RefreshCw } from "lucide-react";
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
        label: 'Add Metadata',
        description: 'Create Configuration',
        longDescription: 'Configure the metadata profile name, type, and JSON configuration.',
        component: PodProfileForm,
    }
];

function MetadataProfiles() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
    const [viewMetadataDialogOpen, setViewMetadataDialogOpen] = useState(false);
    const [metadataStep, setMetadataStep] = useState("config");
    const [viewMetadataStep, setViewMetadataStep] = useState("view");
    const [metadataProfiles, setMetadataProfiles] = useState<any[]>([]);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [viewMetadataInitialValues, setViewMetadataInitialValues] = useState<any>(null);

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
        fetchMetadataProfiles();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "pod_metadata_profile" && metadataProfiles.length > 0) {
            const profile = metadataProfiles.find(p => p.id == focusId);
            if (profile) {
                setViewMetadataInitialValues(profile);
                setViewMetadataStep("view");
                setViewMetadataDialogOpen(true);
            }
        }
    }, [autoOpen, focusId, resourceType, metadataProfiles]);

    const fetchMetadataProfiles = async () => {
        setLoadingMetadata(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfileGet({ namespace: selectedNamespace });
            setMetadataProfiles(data as any[]);
        } finally {
            setLoadingMetadata(false);
        }
    };

    const handleSubmitMetadata = async (values: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfilePost({ requestBody: values });
            toast.success("Metadata profile created");
            setMetadataDialogOpen(false);
            fetchMetadataProfiles();
        } catch (error) {
            toast.error("Error creating metadata profile");
        }
    };

    const handleDeleteMetadata = async (row: any, dependents?: any[]) => {
        if (dependents && dependents.length > 0) {
            setConflictDialog({
                isOpen: true,
                resourceName: row.name,
                resourceType: "Metadata Profile",
                dependents: dependents
            });
        } else {
            fetchMetadataProfiles();
        }
    };

    const handleViewMetadata = (row: any) => {
        setViewMetadataInitialValues(row);
        setViewMetadataStep("view");
        setViewMetadataDialogOpen(true);
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 shadow-sm ring-1 ring-purple-500/20">
                            <Layout className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Metadata Profiles</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Manage reusable metadata configuration profiles in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={fetchMetadataProfiles}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                            setMetadataStep("config");
                            setMetadataDialogOpen(true);
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Metadata
                    </Button>
                </div>
            </div>
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Metadata Profiles"
                    count={metadataProfiles.length}
                    icon={<Layout className="w-4 h-4" />}
                    color="bg-purple-500"
                    className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
                    isLoading={loadingMetadata}
                />
            </div>

            <ViewProfileList
                profiles={metadataProfiles}
                loading={loadingMetadata}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeleteMetadata}
                onViewDetails={handleViewMetadata}
                type="pod_metadata_profile"
                highlightedId={resourceType === 'pod_metadata_profile' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="create-metadata-profile"
                isWizardOpen={metadataDialogOpen}
                setIsWizardOpen={setMetadataDialogOpen}
                currentStep={metadataStep}
                setCurrentStep={setMetadataStep}
                steps={steps}
                schema={profileSchema}
                initialValues={{ name: "", type: "", namespace: selectedNamespace, config: "" }}
                onSubmit={handleSubmitMetadata}
                submitLabel="Create Metadata"
                submitIcon={Layout}
                heading={{
                    primary: "Manage Metadata Profiles",
                    secondary: "Create and configure reusable metadata profiles",
                    icon: Layout,
                }}
            />

            <FormWizard
                name="view-metadata-details"
                isWizardOpen={viewMetadataDialogOpen}
                setIsWizardOpen={setViewMetadataDialogOpen}
                currentStep={viewMetadataStep}
                setCurrentStep={setViewMetadataStep}
                steps={[{
                    id: 'view',
                    label: 'View Metadata Profile',
                    description: 'View Metadata Profile Details',
                    longDescription: 'View the details of the selected metadata profile.',
                    component: (props: any) => viewMetadataInitialValues ? (
                        <ProfileAdvancedConfig profile={viewMetadataInitialValues} profileType="pod_metadata_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={profileSchema}
                initialValues={viewMetadataInitialValues || { name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Layout}
                heading={{
                    primary: "Metadata Profile Details",
                    secondary: "View metadata profile configuration and YAML",
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
        </div>
    );
}

export default MetadataProfiles;

import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Braces, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { BasicConfig } from "@/components/ciCd/library/containerSpec/forms/ContainerSpecForm";
import { ViewSpecList } from "@/components/ciCd/library/containerSpec/forms/ViewSpecList";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";

const createResourceProfileSchema = z.object({
    name: z.string().min(1, "Profile name is required"),
    type: z.string().min(1, "Profile type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.string().optional(),
});

const steps = [
    {
        id: 'add-spec',
        label: 'Add Spec',
        description: 'Create Configuration',
        longDescription: 'Configure the spec name, type, and JSON configuration.',
        component: BasicConfig,
    },
]

const _default_value = {
    name: "",
    namespace: "",
    type: "",
    config: "",
}

function ContainerSpecifications() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [activeTab, setActiveTab] = useState("add-spec");
    const [viewProfileStep, setViewProfileStep] = useState("view");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewProfileInitialValues, setViewProfileInitialValues] = useState<any>(null);

    const [default_value] = useState({ ..._default_value, namespace: selectedNamespace })

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

    // Unified Fetch Effect
    useEffect(() => {
        fetchContainerSpecs();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "profile" && profiles.length > 0) {
            const profile = profiles.find(p => p.id == focusId);
            if (profile) {
                setViewProfileInitialValues(profile);
                setViewProfileStep("view");
                setViewProfileDialogOpen(true);
            }
        }
    }, [autoOpen, focusId, resourceType, profiles]);

    const fetchContainerSpecs = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryProfileGet({ namespace: selectedNamespace });
            setProfiles(data as any[]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        const payload = {
            ...values,
            resource_config: values.config ? JSON.parse(values.config) : {},
        };
        try {
            const response = await fetch("/api/integration/kubernetes/library/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (response.ok) {
                toast.success("Profile created");
                setDialogOpen(false);
                fetchContainerSpecs();
            }
        } catch (error) {
            toast.error("Error saving profile");
        }
    };

    const handleDeleteProfile = async (row: any, dependents?: any[]) => {
        if (dependents && dependents.length > 0) {
            setConflictDialog({
                isOpen: true,
                resourceName: row.name,
                resourceType: "Container Specification",
                dependents: dependents
            });
        } else {
            fetchContainerSpecs();
        }
    };

    const handleViewProfile = (row: any) => {
        setViewProfileInitialValues(row);
        setViewProfileStep("view");
        setViewProfileDialogOpen(true);
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Braces className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Specifications</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Define container specifications for reusability across derived containers in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={() => {
                        fetchContainerSpecs();
                    }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                            setActiveTab("add-spec");
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Spec
                    </Button>
                </div>
            </div>
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Specifications"
                    count={profiles.length}
                    icon={<Braces className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <ViewSpecList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeleteProfile}
                onViewDetails={handleViewProfile}
                highlightedId={resourceType === 'profile' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="create-spec"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={createResourceProfileSchema as z.ZodSchema<any>}
                initialValues={default_value}
                onSubmit={handleSubmit}
                submitLabel="Create Spec"
                submitIcon={Braces}
                heading={{
                    primary: "Manage Container Specs",
                    secondary: "Add new specs, view existing specs, and manage specifications",
                    icon: Braces,
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
                        <ProfileAdvancedConfig profile={viewProfileInitialValues} profileType="profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={createResourceProfileSchema}
                initialValues={viewProfileInitialValues || { name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Braces}
                heading={{
                    primary: "Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: Braces,
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

export default ContainerSpecifications;

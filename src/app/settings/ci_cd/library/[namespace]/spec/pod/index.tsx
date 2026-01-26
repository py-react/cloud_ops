import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Box, RefreshCw, Layout, Settings } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { PodList } from "@/components/ciCd/library/podSpec/PodList";
import { PodProfileForm } from "@/components/ciCd/library/podSpec/forms/PodProfileForm";
import { PodForm, PodAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/PodForm";
import { PodSettingsForm } from "@/components/ciCd/library/podSpec/forms/PodSettingsForm";
import { ViewProfileList } from "@/components/ciCd/library/podSpec/forms/ViewProfileList";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

const podSchema = z.object({
    name: z.string().min(1, "Pod name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    metadata_profile_id: z.number().optional(),
    containers: z.array(z.number()).min(1, "At least one container is required"),
    dynamic_attr: z.record(z.number()).optional(),
    // New Settings
    service_account_name: z.string().optional(),
    automount_service_account_token: z.boolean().optional(),
    host_network: z.boolean().optional(),
    dns_policy: z.string().optional(),
    hostname: z.string().optional(),
    subdomain: z.string().optional(),
    termination_grace_period_seconds: z.number().optional(),
    enable_service_links: z.boolean().optional(),
    share_process_namespace: z.boolean().optional()
});

const profileStepsRaw = [
    {
        id: 'list',
        label: 'View List',
        description: 'View All Profiles',
        longDescription: 'View all configured profiles in this namespace.',
        component: ViewProfileList,
        hideSectionHeader: true,
        hideActions: true,
    },
    {
        id: 'config',
        label: 'Add Profile',
        description: 'Create Configuration',
        longDescription: 'Configure the profile name, type, and JSON configuration.',
        component: PodProfileForm,
    }
];

function PodLibrary() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [pods, setPods] = useState<any[]>([]);
    const [podProfiles, setPodProfiles] = useState<any[]>([]);
    const [metadataProfiles, setMetadataProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    // Dialog states
    const [podDialogOpen, setPodDialogOpen] = useState(false);

    // Wizard step states
    const [podStep, setPodStep] = useState("setup");
    const [viewPodStep, setViewPodStep] = useState("view");

    // View details state
    const [viewPodDialogOpen, setViewPodDialogOpen] = useState(false);
    const [viewPodInitialValues, setViewPodInitialValues] = useState<any>(null);
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
        fetchPods();
    }, [selectedNamespace]);

    // Handle Deep Linking / Auto-open
    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;

        if (resourceType === "pod" && pods.length > 0) {
            const pod = pods.find(p => p.id == focusId);
            if (pod) handleViewDetails(pod);
        }
    }, [autoOpen, focusId, resourceType, pods]);

    const fetchPods = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryPodGet({ namespace: selectedNamespace });
            setPods(data as any[]);
        } catch (error) {
            console.error("Error fetching pods:", error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreatePod = async (values: any) => {
        try {
            if (editMode && editingId) {
                await DefaultService.apiIntegrationKubernetesLibraryPodPut({ id: editingId, requestBody: values } as any);
                toast.success(`Updated ${values.name}`);
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryPodPost({ requestBody: values });
                toast.success(`Created ${values.name}`);
            }
            setPodDialogOpen(false);
            fetchPods();
        } catch (error) {
            toast.error(editMode ? "Error updating pod" : "Error creating pod");
        }
    };



    const handleDeletePod = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryPodDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchPods();
        } catch (error: any) {
            console.error("Error deleting pod:", error);
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Pod Specification",
                    dependents: dependents
                });
            } else {
                toast.error("Error deleting pod");
            }
        }
    };



    const handleViewDetails = (row: any) => {
        setViewPodInitialValues({
            name: row.name,
            namespace: row.namespace,
            containers: row.containers || [],
            dynamic_attr: row.dynamic_attr || {},
            metadata_profile_id: row.metadata_profile_id
        });
        setViewPodStep("view");
        setViewPodDialogOpen(true);
    };

    const handleEditPod = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
        const transformedPod = {
            name: row.name,
            namespace: row.namespace,
            containers: row.containers || [],
            dynamic_attr: row.dynamic_attr || {},
            metadata_profile_id: row.metadata_profile_id,
            service_account_name: row.service_account_name,
            image_pull_secrets: row.image_pull_secrets || [],
            node_selector: row.node_selector || {},
            tolerations: row.tolerations || []
        };
        setViewPodInitialValues(transformedPod);
        setPodStep("setup");
        setPodDialogOpen(true);
    };



    const podSteps = useMemo(() => [
        {
            id: 'setup',
            label: 'Pod Setup',
            description: 'Configure pod specification',
            longDescription: 'Select containers and profiles to define your pod specification.',
            component: (props: any) => <PodForm {...props} namespace={selectedNamespace} />,
        },
        {
            id: 'settings',
            label: 'Pod Settings',
            description: 'Configure pod-level settings',
            longDescription: 'Configure service account, networking, and other pod-level properties.',
            component: (props: any) => <PodSettingsForm {...props} namespace={selectedNamespace} />,
        },
        {
            id: 'view',
            label: 'View',
            description: 'View Pod Specification',
            longDescription: 'Review the generated YAML for your Pod specification.',
            component: (props: any) => <PodAdvancedConfig {...props} namespace={selectedNamespace} />,
        }
    ], [selectedNamespace]);

    const podViewSteps = useMemo(() => [
        {
            id: 'view',
            label: 'View Derived Pod',
            description: 'View Derived Pod Details',
            longDescription: 'View the details of the selected derived pod.',
            component: (props: any) => <PodAdvancedConfig {...props} namespace={selectedNamespace} />,
            hideSectionHeader: true,
        }
    ], [selectedNamespace]);



    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Box className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Derived Pods</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Define pod-level configurations composed from profiles and containers in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={fetchPods}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" size="sm" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setPodStep("setup");
                        setViewPodInitialValues({
                            name: "",
                            namespace: selectedNamespace,
                            containers: [],
                            dynamic_attr: {},
                        });
                        setPodDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Derived Pod
                    </Button>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Derived Pods"
                    count={pods.length}
                    icon={<Box className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <PodList
                pods={pods}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeletePod}
                onViewDetails={handleViewDetails}
                onEdit={handleEditPod}
                highlightedId={resourceType === 'pod' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="create-pod-spec"
                isWizardOpen={podDialogOpen}
                setIsWizardOpen={setPodDialogOpen}
                currentStep={podStep}
                setCurrentStep={setPodStep}
                steps={podSteps}
                schema={podSchema}
                initialValues={viewPodInitialValues}
                onSubmit={handleCreatePod}
                submitLabel={editMode ? "Update Pod" : "Create Pod"}
                submitIcon={Box}
                heading={{
                    primary: editMode ? "Edit Derived Pod" : "Create Derived Pod",
                    secondary: editMode ? "Update derived pod configuration" : "Define a new derived pod by linking containers and selecting profiles",
                    icon: Box,
                }}
            />


            <FormWizard
                name="view-pod-details"
                isWizardOpen={viewPodDialogOpen}
                setIsWizardOpen={setViewPodDialogOpen}
                currentStep={viewPodStep}
                setCurrentStep={setViewPodStep}
                steps={podViewSteps}
                schema={podSchema}
                initialValues={viewPodInitialValues}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Box}
                heading={{
                    primary: "Derived Pod Details",
                    secondary: "View generated YAML and configuration",
                    icon: Box,
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

export default PodLibrary;

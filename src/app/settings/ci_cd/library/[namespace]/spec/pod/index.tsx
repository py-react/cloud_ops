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
import { DefaultService } from "@/gingerJs_api_client";

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
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);

    // Wizard step states
    const [podStep, setPodStep] = useState("setup");
    const [profileStep, setProfileStep] = useState("config");
    const [metadataStep, setMetadataStep] = useState("config");
    const [viewPodStep, setViewPodStep] = useState("view");

    // View details state
    const [viewPodDialogOpen, setViewPodDialogOpen] = useState(false);
    const [viewPodInitialValues, setViewPodInitialValues] = useState<any>({
        name: "",
        metadata_profile_id: "",
        namespace: selectedNamespace,
        containers: [],
        dynamic_attr: {},
        service_account_name: "",
        automount_service_account_token: undefined,
        host_network: undefined,
        dns_policy: "",
        hostname: "",
        subdomain: "",
        termination_grace_period_seconds: undefined,
        enable_service_links: undefined,
        share_process_namespace: undefined
    });

    useEffect(() => {
        fetchPods();
        fetchPodProfiles();
        fetchMetadataProfiles();
    }, [selectedNamespace]);

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

    const fetchPodProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryPodProfileGet({ namespace: selectedNamespace });
            setPodProfiles(data as any[]);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const fetchMetadataProfiles = async () => {
        setLoadingMetadata(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfileGet({ namespace: selectedNamespace });
            setMetadataProfiles(data as any[]);
        } finally {
            setLoadingMetadata(false);
        }
    };

    const handleCreatePod = async (values: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryPodPost({ requestBody: values } as any);
            toast.success("Pod specification created");
            setPodDialogOpen(false);
            fetchPods();
        } catch (error) {
            toast.error("Error creating pod");
        }
    };

    const handleCreateProfile = async (values: any) => {
        try {
            const payload = { ...values, config: typeof values.config === 'string' ? JSON.parse(values.config) : values.config };
            await DefaultService.apiIntegrationKubernetesLibraryPodProfilePost({ requestBody: payload } as any);
            toast.success("Pod profile created");
            fetchPodProfiles();
            setProfileStep("list");
        } catch (error) {
            toast.error("Error creating pod profile");
        }
    };

    const handleCreateMetadata = async (values: any) => {
        try {
            const payload = { ...values, config: typeof values.config === 'string' ? JSON.parse(values.config) : values.config };
            await DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfilePost({ requestBody: payload } as any);
            toast.success("Metadata profile created");
            fetchMetadataProfiles();
            setMetadataStep("list");
        } catch (error) {
            toast.error("Error creating metadata profile");
        }
    };

    const handleDeletePod = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryPodDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchPods();
        } catch (error) {
            console.error("Error deleting pod:", error);
            toast.error("Error deleting pod");
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
            label: 'View Pod spec',
            description: 'View Pod Details',
            longDescription: 'View the details of the selected pod specification.',
            component: (props: any) => <PodAdvancedConfig {...props} namespace={selectedNamespace} />,
        }
    ], [selectedNamespace]);

    const podProfileSteps = profileStepsRaw.map(step => ({
        ...step,
        component: (props: any) => {
            if (step.id === 'list') {
                return <ViewProfileList
                    profiles={podProfiles}
                    loading={loadingProfiles}
                    selectedNamespace={selectedNamespace}
                    onDelete={fetchPodProfiles}
                    type="pod_profile"
                    {...props}
                />;
            }
            return <step.component {...props} />;
        }
    }));

    const metadataProfileSteps = profileStepsRaw.map(step => ({
        ...step,
        component: (props: any) => {
            if (step.id === 'list') {
                return <ViewProfileList
                    profiles={metadataProfiles}
                    loading={loadingMetadata}
                    selectedNamespace={selectedNamespace}
                    onDelete={fetchMetadataProfiles}
                    type="pod_metadata_profile"
                    {...props}
                />;
            }
            return <step.component {...props} title="Metadata Profile" />;
        }
    }));

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Box className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Pod Specifications</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Define pod-level configurations and link containers for <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={() => {
                        fetchPods();
                        fetchPodProfiles();
                        fetchMetadataProfiles();
                    }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            setMetadataStep("config");
                            setMetadataDialogOpen(true);
                        }}>
                            <Settings className="w-3.5 h-3.5 mr-1" />
                            Manage Metadata
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            setProfileStep("config");
                            setProfileDialogOpen(true);
                        }}>
                            <Layout className="w-3.5 h-3.5 mr-1" />
                            Manage Profiles
                        </Button>
                        <Button variant="gradient" size="sm" onClick={() => {
                            setPodStep("setup");
                            setPodDialogOpen(true);
                        }}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            New Pod Spec
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Pod Specifications"
                    count={pods.length}
                    icon={<Box className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Pod Profiles"
                    count={podProfiles.length}
                    icon={<Settings className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loadingProfiles}
                />
                <ResourceCard
                    title="Metadata Profiles"
                    count={metadataProfiles.length}
                    icon={<Layout className="w-4 h-4" />}
                    color="bg-purple-500"
                    className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
                    isLoading={loadingMetadata}
                />
            </div>

            <PodList
                pods={pods}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeletePod}
                onViewDetails={handleViewDetails}
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
                submitLabel="Create Pod Spec"
                submitIcon={Box}
                heading={{
                    primary: "Create Pod Specification",
                    secondary: "Define a new pod by linking containers and selecting profiles",
                    icon: Box,
                }}
            />

            <FormWizard
                name="manage-pod-profile"
                isWizardOpen={profileDialogOpen}
                setIsWizardOpen={setProfileDialogOpen}
                currentStep={profileStep}
                setCurrentStep={setProfileStep}
                steps={podProfileSteps}
                schema={profileSchema}
                initialValues={{ name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={handleCreateProfile}
                submitLabel="Create Profile"
                submitIcon={Settings}
                heading={{
                    primary: "Manage Pod Profiles",
                    secondary: "Add new profiles or view existing ones",
                    icon: Settings,
                }}
            />

            <FormWizard
                name="manage-metadata-profile"
                isWizardOpen={metadataDialogOpen}
                setIsWizardOpen={setMetadataDialogOpen}
                currentStep={metadataStep}
                setCurrentStep={setMetadataStep}
                steps={metadataProfileSteps}
                schema={profileSchema}
                initialValues={{ name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={handleCreateMetadata}
                submitLabel="Create Metadata Profile"
                submitIcon={Layout}
                heading={{
                    primary: "Manage Metadata Profiles",
                    secondary: "Add new metadata profiles or view existing ones",
                    icon: Layout,
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
                    primary: "Pod Specification Details",
                    secondary: "View generated YAML and configuration",
                    icon: Box,
                }}
                hideActions={true}
            />

            <FormWizard
                name="view-pod-details"
                isWizardOpen={viewPodDialogOpen}
                setIsWizardOpen={setViewPodDialogOpen}
                currentStep={viewPodStep}
                setCurrentStep={setViewPodStep}
                steps={podViewSteps}
                schema={podSchema as z.ZodSchema<any>}
                initialValues={viewPodInitialValues}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={Box}
                heading={{
                    primary: "Pod Specification Details",
                    secondary: "View generated YAML and configuration",
                    icon: Box,
                }}
                hideActions={true}
            />
        </div>
    );
}

export default PodLibrary;

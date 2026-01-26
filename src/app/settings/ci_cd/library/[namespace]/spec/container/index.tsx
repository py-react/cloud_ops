import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Container, Plus, RefreshCw, SquareTerminal } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { BasicConfig } from "@/components/ciCd/library/containerSpec/forms/ContainerSpecForm";
import { ViewSpecList } from "@/components/ciCd/library/containerSpec/forms/ViewSpecList";
import { ViewDerivedContainerList } from "@/components/ciCd/library/derivedContainer/forms/ViewDerivedContainerList";
import { DerivedContainerList } from "@/components/ciCd/library/derivedContainer/DerivedContainerList";
import { BasicConfig as ContainerBasicConfig, AdvancedConfig as ContainerAdvancedConfig } from "@/components/ciCd/library/derivedContainer/forms/DerivedContainerForm";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";

const createResourceProfuleSchema = z.object({
    name: z.string().min(1, "Profile name is required"),
    type: z.string().min(1, "Profile type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.string().optional(),
});

const createContainerProfileSchema = z.object({
    name: z.string().min(1, "Container name is required"),
    description: z.string().min(1, "Container description is required"),
    namespace: z.string().min(1, "Namespace is required"),
    image_pull_policy: z.string().optional(),
    command: z.any().optional(),
    args: z.any().optional(),
    working_dir: z.string().optional(),
    profile: z.any().optional()
});


const steps = [
    {
        id: 'add-spec',
        label: 'Add Spec',
        description: 'Create Configuration',
        longDescription: 'Configure the spec name, type, and JSON configuration.',
        component: BasicConfig,
    },
    {
        id: 'view-spec',
        label: 'View Spec List',
        description: 'View All Specs',
        longDescription: 'View all container specifications.',
        component: ViewSpecList,
        hideSectionHeader: true,
    },
]

const _default_value = {
    name: "",
    namespace: "",
    type: "",
    config: "",
}

const _container_default_values = {
    name: "",
    namespace: "",
    description: "",
    image_pull_policy: "IfNotPresent",
    command: new Set(),
    args: new Set(),
    working_dir: "",
    profile: {},
}

const container_steps = [
    {
        id: 'basic',
        label: 'Basic Info',
        description: 'Container configuration',
        longDescription: 'Configure the basic container settings including name, image, and pull policy.',
        component: ContainerBasicConfig,
    },
    {
        id: 'advanced',
        label: 'Advanced Config',
        description: 'Advanced Configuration',
        longDescription: 'Fine-tune your container configuration in YAML format. Profile attributes are read-only.',
        component: ContainerAdvancedConfig,
    },
]


const ViewContainer = ({ control }: { control: any }) => {
    return (
        <>hey</>
    )
}


const container_view_steps = [
    {
        id: 'view',
        label: 'View Derived Container',
        description: 'View Derived Container Details',
        longDescription: 'View the details of the selected derived container.',
        component: ContainerAdvancedConfig,
        props: { canEdit: false },
        hideSectionHeader: true,
    }
]




function ContainerSpec() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [containerViewactiveTab, setContainerViewactiveTab] = useState("view");
    const [containerActiveTab, setContainerActiveTab] = useState("basic");
    const [viewProfileStep, setViewProfileStep] = useState("view");
    const [dialogContainerViewOpen, setDialogContainerViewOpen] = useState(false);
    const [dialogContainerOpen, setDialogContainerOpen] = useState(false);
    const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [containersForPod, setContainersForPod] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingContainersForPod, setLoadingContainersForPod] = useState(false);
    const [viewProfileInitialValues, setViewProfileInitialValues] = useState<any>(null);

    const [container_default_values] = useState({ ..._container_default_values, namespace: selectedNamespace })
    const [container_view_initial_values, setContainerViewInitialValues] = useState(container_default_values)

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
        fetchPodSpecs();
    }, [selectedNamespace]);

    useEffect(() => {
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "container" && containersForPod.length > 0) {
            const container = containersForPod.find(c => c.id == focusId);
            if (container) handleViewContainer(container);
        } else if (resourceType === "pod_profile" && profiles.length > 0) {
            const profile = profiles.find(p => p.id == focusId);
            if (profile) {
                setViewProfileInitialValues(profile);
                setViewProfileStep("view");
                setViewProfileDialogOpen(true);
            }
        }
    }, [autoOpen, focusId, resourceType, containersForPod, profiles]);

    const fetchContainerSpecs = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryProfileGet({ namespace: selectedNamespace });
            setProfiles(data as any[]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPodSpecs = async () => {
        try {
            setLoadingContainersForPod(true)
            const data = await DefaultService.apiIntegrationKubernetesLibraryContainerGet({ namespace: selectedNamespace });
            setContainersForPod(data as any[]);
        } catch (error) {
            console.error("Error fetching pod specs:", error);
        } finally {
            setLoadingContainersForPod(false)
        }
    };

    const handleViewContainer = (row: any) => {
        setDialogContainerViewOpen(true);
        const transformedContainer = {
            ...row,
            args: row.args || [],
            command: row.command || [],
            profile: Object.keys(row.dynamic_attr || {}).reduce((acc, key) => {
                acc[key] = profiles.find(p => p.id === row.dynamic_attr[key]);
                return acc;
            }, {} as any)
        }
        delete transformedContainer.dynamic_attr;
        delete transformedContainer.id;
        delete transformedContainer.description;
        transformedContainer.image = "<IMAGE_NAME_FILLED_AT_RUNTIME>";
        setContainerViewInitialValues(transformedContainer);
    };


    const handleContainerSubmit = async (values: any) => {
        const valueProfiles = { ...values.profile }
        const transformedProfile: any = {}

        Object.keys(valueProfiles).map(key => {
            transformedProfile[key] = valueProfiles[key].id
        })

        const payload = {
            ...values,
            args: Array.isArray(values.args) ? values.args : Array.from(values.args || []),
            command: Array.isArray(values.command) ? values.command : Array.from(values.command || []),
            dynamic_attr: transformedProfile
        };

        delete payload.profile

        try {
            const response = await fetch("/api/integration/kubernetes/library/container", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                toast.success("Profile created");
                setDialogContainerOpen(false);
                fetchPodSpecs();
            }
        } catch (error) {
            toast.error("Error saving profile");
        }
    };


    const handleDeleteContainer = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryContainerDelete({ id: row.id });
            toast.success(`Deleted ${row.name}`);
            fetchPodSpecs();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Container Profile",
                    dependents: dependents
                });
            } else {
                toast.error(`Error deleting container ${row.name}`);
            }
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
                            <SquareTerminal className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Derived Container</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Manage derived containers composed from specifications in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={() => {
                        fetchContainerSpecs();
                        fetchPodSpecs();
                    }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                            setDialogContainerOpen(true)
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Derived Container
                    </Button>
                </div>
            </div>
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Derived Containers"
                    count={containersForPod.length}
                    icon={<SquareTerminal className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <DerivedContainerList
                profiles={containersForPod}
                loading={loadingContainersForPod}
                selectedNamespace={selectedNamespace}
                onDelete={handleDeleteContainer}
                onViewDetails={handleViewContainer}
                highlightedId={resourceType === 'container' ? highlightedId : null}
                onRowClick={clearFocus}
            />

            <FormWizard
                name="create-container-profile"
                isWizardOpen={dialogContainerOpen}
                setIsWizardOpen={setDialogContainerOpen}
                currentStep={containerActiveTab}
                setCurrentStep={setContainerActiveTab}
                steps={container_steps}
                schema={createContainerProfileSchema as z.ZodSchema<any>}
                initialValues={container_default_values}
                onSubmit={handleContainerSubmit}
                submitLabel="Create Container"
                submitIcon={Container}
                heading={{
                    primary: "Create Derived Container",
                    secondary: "Configure a new derived container for your deployments",
                    icon: Container,
                }}

            />


            <FormWizard
                name="show-container-details"
                isWizardOpen={dialogContainerViewOpen}
                setIsWizardOpen={setDialogContainerViewOpen}
                currentStep={containerViewactiveTab}
                setCurrentStep={setContainerViewactiveTab}
                steps={container_view_steps}
                schema={createContainerProfileSchema as z.ZodSchema<any>}
                initialValues={container_view_initial_values}
                onSubmit={() => { }}
                submitLabel="View Container"
                submitIcon={Container}
                heading={{
                    primary: "Derived Container Details",
                    secondary: "View derived container details",
                    icon: Container,
                }}
                hideActions={true}
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
                schema={createResourceProfuleSchema}
                initialValues={viewProfileInitialValues || { name: "", type: "", namespace: selectedNamespace, config: "{}" }}
                onSubmit={() => { }}
                submitLabel="View Details"
                submitIcon={SquareTerminal}
                heading={{
                    primary: "Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: SquareTerminal,
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
        </div >
    );
}

export default ContainerSpec;

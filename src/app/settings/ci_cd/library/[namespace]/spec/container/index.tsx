import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Box, Plus, RefreshCw, Container, SquareTerminal } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { DerivedContainerList } from "@/components/ciCd/library/derivedContainer/DerivedContainerList";
import { BasicConfig as ContainerBasicConfig, AdvancedConfig as ContainerAdvancedConfig } from "@/components/ciCd/library/derivedContainer/forms/DerivedContainerForm";
import { DefaultService } from "@/gingerJs_api_client";
import { useResourceLink } from "@/hooks/useResourceLink";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import PageLayout from "@/components/PageLayout";

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
        label: 'View Config',
        description: 'Advanced Configuration',
        longDescription: 'Fine-tune your container configuration in YAML format. Profile attributes are read-only.',
        component: ContainerAdvancedConfig,
        props: { canEdit: false },
    },
]

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
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [container_default_values] = useState({ ..._container_default_values, namespace: selectedNamespace })
    const [container_view_initial_values, setContainerViewInitialValues] = useState(container_default_values)

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

    const parseDynamicAttr = (attr: any) => {
        if (!attr) return {};
        if (typeof attr === 'string') {
            try {
                return JSON.parse(attr);
            } catch (e) {
                console.error("Failed to parse dynamic_attr:", e);
                return {};
            }
        }
        return attr;
    };

    const handleViewContainer = (row: any) => {
        setDialogContainerViewOpen(true);
        const dynamic_attr = parseDynamicAttr(row.dynamic_attr);
        const transformedContainer = {
            ...row,
            args: Array.isArray(row.args) ? row.args : [],
            command: Array.isArray(row.command) ? row.command : [],
            profile: Object.keys(dynamic_attr).reduce((acc, key) => {
                acc[key] = profiles.find(p => p.id === dynamic_attr[key]);
                return acc;
            }, {} as any)
        }
        delete transformedContainer.dynamic_attr;
        delete transformedContainer.id;
        delete transformedContainer.description;
        transformedContainer.image = "<IMAGE_NAME_FILLED_AT_RUNTIME>";
        setContainerViewInitialValues(transformedContainer);
    };

    const handleEditContainer = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
        const dynamic_attr = parseDynamicAttr(row.dynamic_attr);
        const transformedContainer = {
            ...row,
            args: new Set(Array.isArray(row.args) ? row.args : []),
            command: new Set(Array.isArray(row.command) ? row.command : []),
            profile: Object.keys(dynamic_attr).reduce((acc, key) => {
                acc[key] = profiles.find(p => p.id === dynamic_attr[key]);
                return acc;
            }, {} as any)
        }
        setContainerViewInitialValues(transformedContainer);
        setDialogContainerOpen(true);
    };

    const handleContainerSubmit = async (values: any) => {
        const valueProfiles = { ...values.profile }
        const transformedProfile: any = {}

        Object.keys(valueProfiles).map(key => {
            transformedProfile[key] = valueProfiles[key]?.id
        })

        const payload = {
            ...values,
            args: Array.isArray(values.args) ? values.args : Array.from(values.args || []),
            command: Array.isArray(values.command) ? values.command : Array.from(values.command || []),
            dynamic_attr: transformedProfile
        };

        delete payload.profile

        try {
            if (editMode && editingId) {
                await DefaultService.apiIntegrationKubernetesLibraryContainerPut({ id: editingId, requestBody: payload } as any);
                toast.success("Container updated");
                setDialogContainerOpen(false);
                fetchPodSpecs();
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryContainerPost({ requestBody: payload });
                toast.success("Container created");
                setDialogContainerOpen(false);
                fetchPodSpecs();
            }
        } catch (error) {
            toast.error(editMode ? "Error updating container" : "Error saving container");
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

    return (
        <PageLayout
            title="Derived Container"
            subtitle={
                <>
                    Manage derived containers composed from specifications in <span className="text-primary font-bold">{selectedNamespace}</span>.
                </>
            }
            icon={SquareTerminal}
            actions={
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={() => {
                        fetchContainerSpecs();
                        fetchPodSpecs();
                    }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setContainerViewInitialValues({
                            name: "",
                            namespace: selectedNamespace,
                            image_name: "",
                            profile: {}
                        } as any);
                        setDialogContainerOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Derived Container
                    </Button>
                </div>
            }
        >
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
                onEdit={handleEditContainer}
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
                initialValues={container_view_initial_values}
                onSubmit={handleContainerSubmit}
                submitLabel={editMode ? "Update Container" : "Create Container"}
                submitIcon={Box}
                heading={{
                    primary: editMode ? "Edit Derived Container" : "Create Derived Container",
                    secondary: editMode ? "Update derived container configuration" : "Configure a new derived container for your deployments",
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
        </PageLayout>
    );
}

export default ContainerSpec;

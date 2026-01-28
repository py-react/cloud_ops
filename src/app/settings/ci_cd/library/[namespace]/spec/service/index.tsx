import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Layers, Network } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService, K8sService } from "@/gingerJs_api_client";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from "@/components/ui/input";

// Placeholder for the form component (Refactored below)
import DerivedServiceForm from "../../../../../../../components/ciCd/library/serviceSpec/forms/DerivedServiceForm";
import { ServiceAdvancedConfig } from "../../../../../../../components/ciCd/library/serviceSpec/forms/ServiceAdvancedConfig";

const serviceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    metadata_profile_id: z.number().nullable().optional(),
    selector_profile_id: z.number().nullable().optional(),
    dynamic_attr: z.any().optional(),

    // Advanced Spec Fields
    type: z.string().nullable().optional(),
    cluster_ip: z.string().nullable().optional(),
    ip_family_policy: z.string().nullable().optional(),
    session_affinity: z.string().nullable().optional(),
    internal_traffic_policy: z.string().nullable().optional(),
    external_traffic_policy: z.string().nullable().optional(),
    publish_not_ready_addresses: z.boolean().nullable().optional(),
    load_balancer_ip: z.string().nullable().optional(),
    health_check_node_port: z.number().nullable().optional(),
    allocate_load_balancer_node_ports: z.boolean().nullable().optional(),
    load_balancer_class: z.string().nullable().optional(),
    external_name: z.string().nullable().optional(),
});

const default_value = {
    name: "",
    namespace: "",
    metadata_profile_id: null,
    selector_profile_id: null,
    dynamic_attr: {},
    type: "ClusterIP",
    cluster_ip: null,
    ip_family_policy: "SingleStack",
    session_affinity: "None",
    internal_traffic_policy: "Cluster",
    external_traffic_policy: "Cluster",
    publish_not_ready_addresses: false,
    load_balancer_ip: null,
    health_check_node_port: null,
    allocate_load_balancer_node_ports: true,
    load_balancer_class: null,
    external_name: null,
};

export default function DerivedServiceList() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [services, setServices] = useState<K8sService[]>([]);
    const [filteredServices, setFilteredServices] = useState<K8sService[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("setup");
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [initialValues, setInitialValues] = useState<any>(default_value);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Conflict handling
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

    useEffect(() => {
        fetchServices();
    }, [selectedNamespace]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        setFilteredServices(services.filter(s =>
            s.name.toLowerCase().includes(query)
        ));
    }, [searchQuery, services]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryServiceGet({ namespace: selectedNamespace });
            setServices((data as K8sService[]) || []);
        } catch (err: any) {
            toast.error("Failed to fetch services");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryServiceDelete({ id: row.id! });
            toast.success(`Deleted ${row.name}`);
            fetchServices();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Derived Service",
                    dependents: dependents
                });
            } else {
                toast.error(`Error deleting service ${row.name}`);
            }
        }
    };

    const handleEdit = (row: any) => {
        setEditMode(true);
        setEditingId(row.id!);
        // Ensure dynamic_attr is handled
        setInitialValues({
            ...row,
        });
        setActiveTab("setup");
        setDialogOpen(true);
    };

    const handleView = (row: any) => {
        setInitialValues(row);
        setDialogOpen(false); // Close edit if open
        // We'll use a separate view wizard or just a different state
        setViewDialogOpen(true);
    };

    const serviceSteps = useMemo(() => [
        {
            id: 'setup',
            label: 'Service Composition',
            description: 'Compose Service',
            longDescription: 'Select profiles to compose the service.',
            component: (props: any) => <DerivedServiceForm {...props} namespace={selectedNamespace} />,
        },
        {
            id: 'preview',
            label: 'View Configuration',
            description: 'Verify YAML manifest',
            longDescription: 'Review the generated Kubernetes Service manifest and composition details.',
            component: (props: any) => <ServiceAdvancedConfig {...props} namespace={selectedNamespace} />,
        }
    ], [selectedNamespace]);

    const serviceViewSteps = useMemo(() => [
        {
            id: 'view',
            label: 'Service Details',
            description: 'View Service Summary',
            longDescription: 'View the composition and details of this service.',
            component: (props: any) => <ServiceAdvancedConfig {...props} namespace={selectedNamespace} />,
            hideSectionHeader: true,
        },
    ], [selectedNamespace]);

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Derived Services</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Manage composed service specifications in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={fetchServices}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setActiveTab("setup");
                        setInitialValues({ ...default_value, namespace: selectedNamespace });
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Service
                    </Button>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Services"
                    count={services.length}
                    icon={<Network className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0">
                <ResourceTable
                    className="pt-0"
                    loading={loading}
                    title="Services"
                    description={`Manage service specifications in ${selectedNamespace}.`}
                    icon={<Network className="h-5 w-5" />}
                    columns={[
                        { accessor: "name", header: "Name" },
                        // { accessor: "type", header: "Type" }, // Type is now in profile, access logic might need update or just hide checks
                    ]}
                    data={filteredServices}
                    extraHeaderContent={
                        <Input
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-64"
                        />
                    }
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onViewDetails={handleView}
                />
            </div>

            <FormWizard
                name="service-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={serviceSteps}
                schema={serviceSchema}
                initialValues={initialValues || default_value}
                onSubmit={async (values) => {
                    try {
                        if (editMode && editingId) {
                            await DefaultService.apiIntegrationKubernetesLibraryServicePut({ id: editingId, requestBody: values } as any);
                            toast.success(`Updated ${values.name}`);
                        } else {
                            await DefaultService.apiIntegrationKubernetesLibraryServicePost({ requestBody: values } as any);
                            toast.success(`Created ${values.name}`);
                        }
                        setDialogOpen(false);
                        fetchServices();
                    } catch (error: any) {
                        const detail = error.body?.detail || error.message || "Unknown error";
                        toast.error(`Operation failed: ${detail}`);
                    }
                }}
                submitLabel={editMode ? "Update Service" : "Create Service"}
                submitIcon={Layers}
                heading={{
                    primary: editMode ? "Edit Derived Service" : "Create Derived Service",
                    secondary: editMode ? "Update service specification" : "Define a new service by composing profiles",
                    icon: Layers,
                }}
            />

            <FormWizard
                name="view-service-details"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep="view"
                setCurrentStep={() => { }}
                steps={serviceViewSteps}
                schema={serviceSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "Service Details",
                    secondary: "View service composition details",
                    icon: Network,
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

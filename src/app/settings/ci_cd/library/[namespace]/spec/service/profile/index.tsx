import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Plus, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService, K8sServiceProfile } from "@/gingerJs_api_client";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from "@/components/ui/input";
import { PodProfileForm } from "@/components/ciCd/library/podSpec/forms/PodProfileForm";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

export default function ServiceProfileList() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<K8sServiceProfile[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<K8sServiceProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("config");
    const [viewTab, setViewTab] = useState("view");
    const [initialValues, setInitialValues] = useState<any>({ name: "", type: "service", namespace: selectedNamespace, config: "{}" });
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
        fetchProfiles();
    }, [selectedNamespace]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        setFilteredProfiles(profiles.filter(p =>
            p.name.toLowerCase().includes(query)
        ));
    }, [searchQuery, profiles]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryServiceProfileGet({ namespace: selectedNamespace });
            setProfiles((data as any) || []);
        } catch (err: any) {
            toast.error("Failed to fetch profiles");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryServiceProfileDelete({ id: row.id! });
            toast.success(`Deleted ${row.name}`);
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Service Profile",
                    dependents: dependents
                });
            } else {
                toast.error(`Error deleting profile: ${error.message}`);
            }
        }
    };

    const handleEdit = (row: any) => {
        setEditMode(true);
        setEditingId(row.id!);
        // Ensure config is string for Monaco
        const initial = { ...row, config: typeof row.config === 'object' ? JSON.stringify(row.config, null, 2) : row.config };
        setInitialValues(initial);
        setActiveTab("config");
        setDialogOpen(true);
    };

    const handleView = (row: any) => {
        setInitialValues(row);
        setViewTab("view");
        setViewDialogOpen(true);
    };

    const steps = useMemo(() => [{
        id: 'config',
        label: 'Configuration',
        description: 'Configure service ports and type',
        longDescription: 'Define the service type and port mappings using JSON/YAML.',
        component: (props: any) => <PodProfileForm {...props} namespace={selectedNamespace} title="Service Profile" />
    }], []);

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Service Profiles</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Define reusable service specifications (ports, types) for <span className="text-primary font-bold">{selectedNamespace}</span>.
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
                    <Button variant="gradient" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setActiveTab("config");
                        setInitialValues({ name: "", type: "service", namespace: selectedNamespace, config: "{}" });
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Profile
                    </Button>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Service Profiles"
                    count={profiles.length}
                    icon={<Settings2 className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all text-xs"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0">
                <ResourceTable
                    className="pt-0"
                    loading={loading}
                    title="Service Profiles"
                    description={`Specs in ${selectedNamespace}.`}
                    icon={<Settings2 className="h-5 w-5" />}
                    columns={[
                        { accessor: "name", header: "Name" },
                        { accessor: "type", header: "Type" },
                    ]}
                    data={filteredProfiles}
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
                name="service-profile-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={profileSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        const payload = { ...values };
                        if (typeof payload.config === 'string') {
                            try { payload.config = JSON.parse(payload.config); } catch (e) { }
                        }
                        if (editMode && editingId) {
                            await DefaultService.apiIntegrationKubernetesLibraryServiceProfilePut({ id: editingId, requestBody: payload } as any);
                        } else {
                            await DefaultService.apiIntegrationKubernetesLibraryServiceProfilePost({ requestBody: payload } as any);
                        }
                        toast.success(editMode ? "Updated" : "Created");
                        setDialogOpen(false);
                        fetchProfiles();
                    } catch (e) { toast.error("Operation failed"); }
                }}
                submitLabel={editMode ? "Update" : "Create"}
                heading={{
                    primary: editMode ? "Edit Service Profile" : "Create Service Profile",
                    secondary: "Manage service specification profiles",
                    icon: Settings2
                }}
            />

            <FormWizard
                name="view-service-profile"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep={viewTab}
                setCurrentStep={setViewTab}
                steps={[{
                    id: 'view',
                    label: 'View Profile',
                    description: 'View Profile Details',
                    longDescription: 'View the details of the selected service profile.',
                    component: (props: any) => initialValues ? (
                        <ProfileAdvancedConfig profile={initialValues} profileType="service_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={profileSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "Service Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: Settings2,
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

import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tag, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { DefaultService, K8sServiceMetadataProfile } from "@/gingerJs_api_client";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from "@/components/ui/input";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { PodProfileForm } from "@/components/ciCd/library/podSpec/forms/PodProfileForm";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";

const metadataSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

export default function ServiceMetadataList() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [profiles, setProfiles] = useState<K8sServiceMetadataProfile[]>([]);
    const [filtered, setFiltered] = useState<K8sServiceMetadataProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("config");
    const [viewTab, setViewTab] = useState("view");
    const [initialValues, setInitialValues] = useState<any>({ name: "", type: "metadata", namespace: selectedNamespace, config: "{}" });
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

    useEffect(() => { fetchProfiles(); }, [selectedNamespace]);

    useEffect(() => {
        setFiltered(profiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [searchQuery, profiles]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryServiceMetadataGet({ namespace: selectedNamespace });
            setProfiles((data as any) || []);
        } catch (err) { toast.error("Failed to fetch profiles"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (row: any) => {
        try {
            await DefaultService.apiIntegrationKubernetesLibraryServiceMetadataDelete({ id: row.id });
            toast.success("Profile deleted");
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "Metadata Profile",
                    dependents: dependents
                });
            } else {
                toast.error("Failed to delete profile");
            }
        }
    };

    const handleEdit = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
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
        description: 'Manage labels and annotations',
        longDescription: 'Define reusable metadata sets for your services using JSON/YAML.',
        component: (props: any) => <PodProfileForm {...props} title="Metadata Profile" />
    }], []);

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div className="flex items-center gap-4 mb-1 p-1">
                    <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                        <Tag className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Service Metadata</h1>
                        <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                            Manage reusable labels and annotations in <span className="text-primary font-bold">{selectedNamespace}</span>.
                        </p>
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
                        setInitialValues({ name: "", type: "metadata", namespace: selectedNamespace, config: "{}" });
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> New Profile
                    </Button>
                </div>
            </div>

            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Metadata Profiles"
                    count={profiles.length}
                    icon={<Tag className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all text-xs"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0">
                <ResourceTable
                    loading={loading}
                    columns={[
                        { accessor: "name", header: "Name" },
                        { accessor: "type", header: "Type" },
                    ]}
                    data={filtered}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onViewDetails={handleView}
                    extraHeaderContent={
                        <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 w-64" />
                    }
                />
            </div>

            <FormWizard
                name="service-metadata-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={metadataSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        const payload = { ...values };
                        if (typeof payload.config === 'string') {
                            try { payload.config = JSON.parse(payload.config); } catch (e) { }
                        }
                        if (editMode && editingId) {
                            await DefaultService.apiIntegrationKubernetesLibraryServiceMetadataPut({ id: editingId, requestBody: payload } as any);
                        } else {
                            await DefaultService.apiIntegrationKubernetesLibraryServiceMetadataPost({ requestBody: payload } as any);
                        }
                        toast.success(editMode ? "Updated" : "Created");
                        setDialogOpen(false);
                        fetchProfiles();
                    } catch (e) { toast.error("Operation failed"); }
                }}
                submitLabel={editMode ? "Update" : "Create"}
                heading={{
                    primary: editMode ? "Edit Metadata Profile" : "Create Metadata Profile",
                    secondary: "Manage service metadata profiles",
                    icon: Tag
                }}
            />

            <FormWizard
                name="view-metadata-profile"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep={viewTab}
                setCurrentStep={setViewTab}
                steps={[{
                    id: 'view',
                    label: 'View Profile',
                    description: 'View Profile Details',
                    longDescription: 'View the details of the selected metadata profile.',
                    component: (props: any) => initialValues ? (
                        <ProfileAdvancedConfig profile={initialValues} profileType="service_metadata_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={metadataSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "Metadata Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: Tag,
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

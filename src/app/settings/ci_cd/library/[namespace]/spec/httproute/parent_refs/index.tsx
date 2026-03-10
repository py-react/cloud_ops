import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Target, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { DefaultService } from "@/gingerJs_api_client";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from "@/components/ui/input";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { PodProfileForm } from "@/components/ciCd/library/podSpec/forms/PodProfileForm";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import { DeleteDependencyDialog } from "@/components/ciCd/library/podSpec/DeleteDependencyDialog";
import PageLayout from "@/components/PageLayout";
import { useResourceLink } from "@/hooks/useResourceLink";

const parentRefsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

export default function HTTPRouteParentRefsList() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("config");
    const [viewTab, setViewTab] = useState("view");
    const [initialValues, setInitialValues] = useState<any>({ name: "", type: "parent_refs", namespace: selectedNamespace, config: "{}" });
    const [searchQuery, setSearchQuery] = useState("");

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
        if (!autoOpen || !focusId || !resourceType) return;
        if (resourceType === "httproute_parent_refs_profile" && profiles.length > 0) {
            const profile = profiles.find(p => p.id == focusId);
            if (profile) handleView(profile);
        }
    }, [autoOpen, focusId, resourceType, profiles]);

    useEffect(() => { fetchProfiles(); }, [selectedNamespace]);

    useEffect(() => {
        setFiltered(profiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [searchQuery, profiles]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteParentRefsGet({ namespace: selectedNamespace });
            setProfiles((data as any) || []);
        } catch (err) { toast.error("Failed to fetch profiles"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (row: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteParentRefsDelete({ id: row.id });
            toast.success("Profile deleted");
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "HTTPRoute ParentRefs Profile",
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
        description: 'Manage Gateway attachments',
        longDescription: 'Define reusable parent references to attach HTTPRoutes to specific Gateways.',
        component: (props: any) => <PodProfileForm {...props} namespace={selectedNamespace} title="HTTPRoute ParentRefs" />
    }], [selectedNamespace]);

    return (
        <PageLayout
            title="HTTPRoute ParentRefs"
            subtitle={
                <>
                    Manage reusable Gateway attachments for HTTPRoutes in <span className="text-primary font-bold">{selectedNamespace}</span>.
                </>
            }
            icon={Target}
            actions={
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
                        setInitialValues({ name: "", type: "parent_refs", namespace: selectedNamespace, config: "{}" });
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> New Profile
                    </Button>
                </div>
            }
        >
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total ParentRefs Profiles"
                    count={profiles.length}
                    icon={<Target className="w-4 h-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all text-xs"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 mt-4">
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
                    highlightedId={resourceType === 'httproute_parent_refs_profile' ? highlightedId : null}
                    onRowClick={clearFocus}
                    extraHeaderContent={
                        <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 w-64" />
                    }
                />
            </div>

            <FormWizard
                name="httproute-parentrefs-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={parentRefsSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        const payload = { ...values };
                        if (typeof payload.config === 'string') {
                            try { payload.config = JSON.parse(payload.config); } catch (e) { }
                        }
                        if (editMode && editingId) {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteParentRefsPut({ id: editingId, requestBody: payload } as any);
                        } else {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteParentRefsPost({ requestBody: payload } as any);
                        }
                        toast.success(editMode ? "Updated" : "Created");
                        setDialogOpen(false);
                        fetchProfiles();
                    } catch (e) { toast.error("Operation failed"); }
                }}
                submitLabel={editMode ? "Update" : "Create"}
                heading={{
                    primary: editMode ? "Edit ParentRefs Profile" : "Create ParentRefs Profile",
                    secondary: "Manage HTTPRoute parent references",
                    icon: Target
                }}
            />

            <FormWizard
                name="view-httproute-parent-refs-profile"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep={viewTab}
                setCurrentStep={setViewTab}
                steps={[{
                    id: 'view',
                    label: 'View Profile',
                    description: 'View ParentRefs Details',
                    longDescription: 'View the details of the selected parent refs profile.',
                    component: (props: any) => initialValues ? (
                        <ProfileAdvancedConfig profile={initialValues} profileType="httproute_parent_refs_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={parentRefsSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "ParentRefs Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: Target,
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

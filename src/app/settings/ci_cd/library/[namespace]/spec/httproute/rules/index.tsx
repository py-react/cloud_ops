import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WaypointsIcon, Plus, RefreshCw } from "lucide-react";
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

const rulesSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    namespace: z.string().min(1, "Namespace is required"),
    config: z.any().optional()
});

export default function HTTPRouteRulesList() {
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
    const [initialValues, setInitialValues] = useState<any>({ name: "", type: "rules", namespace: selectedNamespace, config: "{}" });
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
        if (resourceType === "httproute_rules_profile" && profiles.length > 0) {
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
            const data = await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteRulesGet({ namespace: selectedNamespace });
            setProfiles((data as any) || []);
        } catch (err) { toast.error("Failed to fetch profiles"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (row: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteRulesDelete({ id: row.id });
            toast.success("Profile deleted");
            fetchProfiles();
        } catch (error: any) {
            if (error.status === 409) {
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                setConflictDialog({
                    isOpen: true,
                    resourceName: row.name,
                    resourceType: "HTTPRoute Rules Profile",
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
        description: 'Manage matches and filters',
        longDescription: 'Define reusable routing rules, matches, and filters for your HTTPRoutes.',
        component: (props: any) => <PodProfileForm {...props} namespace={selectedNamespace} title="HTTPRoute Rules" />
    }], [selectedNamespace]);

    return (
        <PageLayout
            title="HTTPRoute Rules"
            subtitle={
                <>
                    Manage reusable routing rules for HTTPRoutes in <span className="text-primary font-bold">{selectedNamespace}</span>.
                </>
            }
            icon={WaypointsIcon}
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
                        setInitialValues({ name: "", type: "rules", namespace: selectedNamespace, config: "{}" });
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> New Profile
                    </Button>
                </div>
            }
        >
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Rules Profiles"
                    count={profiles.length}
                    icon={<WaypointsIcon className="w-4 h-4" />}
                    color="bg-purple-500"
                    className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all text-xs"
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
                    highlightedId={resourceType === 'httproute_rules_profile' ? highlightedId : null}
                    onRowClick={clearFocus}
                    extraHeaderContent={
                        <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 w-64" />
                    }
                />
            </div>

            <FormWizard
                name="httproute-rules-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={rulesSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        const payload = { ...values };
                        if (typeof payload.config === 'string') {
                            try { payload.config = JSON.parse(payload.config); } catch (e) { }
                        }
                        if (editMode && editingId) {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteRulesPut({ id: editingId, requestBody: payload } as any);
                        } else {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteRulesPost({ requestBody: payload } as any);
                        }
                        toast.success(editMode ? "Updated" : "Created");
                        setDialogOpen(false);
                        fetchProfiles();
                    } catch (e) { toast.error("Operation failed"); }
                }}
                submitLabel={editMode ? "Update" : "Create"}
                heading={{
                    primary: editMode ? "Edit Rules Profile" : "Create Rules Profile",
                    secondary: "Manage HTTPRoute routing rules",
                    icon: WaypointsIcon
                }}
            />

            <FormWizard
                name="view-httproute-rules-profile"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep={viewTab}
                setCurrentStep={setViewTab}
                steps={[{
                    id: 'view',
                    label: 'View Profile',
                    description: 'View Rules Profile Details',
                    longDescription: 'View the details of the selected rules profile.',
                    component: (props: any) => initialValues ? (
                        <ProfileAdvancedConfig profile={initialValues} profileType="httproute_rules_profile" />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={rulesSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "Rules Profile Details",
                    secondary: "View profile configuration and YAML",
                    icon: WaypointsIcon,
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

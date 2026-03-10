import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, NetworkIcon, RefreshCw, FileUp, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import PageLayout from "@/components/PageLayout";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ProfileAdvancedConfig } from "@/components/ciCd/library/podSpec/forms/ProfileAdvancedConfig";
import DerivedHTTPRouteForm from "@/components/ciCd/library/httpRouteSpec/forms/DerivedHTTPRouteForm";
import { YAMLImportForm } from "@/components/kubernetes/YAMLImportForm";

const httpRouteSchema = z.object({
    name: z.string().min(1, "Name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    metadata_profile_id: z.number().optional(),
    rules_profile_id: z.number().optional(),
    parent_refs_profile_id: z.number().optional(),
    hostnames_profile_id: z.number().optional(),
    hostnames: z.string().optional()
});

const yamlImportSchema = z.object({
    manifest: z.string().min(1, "YAML manifest is required"),
});

export default function HTTPRouteList() {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeStep, setActiveStep] = useState("setup");
    const [initialValues, setInitialValues] = useState<any>(null);
    const [yamlImportOpen, setYamlImportOpen] = useState(false);
    // On-demand cluster status map: routeId -> boolean | "checking" | null
    const [routeStatuses, setRouteStatuses] = useState<Record<number, boolean | "checking" | null>>({});

    useEffect(() => { fetchRoutes(); }, [selectedNamespace]);

    const fetchAllStatuses = useCallback(async (routeList: any[]) => {
        if (!routeList.length) return;
        // Set all rows to "checking" immediately so badges animate
        const initial: Record<number, boolean | "checking" | null> = {};
        routeList.forEach(r => { initial[r.id] = "checking"; });
        setRouteStatuses(initial);
        // Fan out parallel checks — each updates state as it lands
        await Promise.allSettled(
            routeList.map(async (r) => {
                try {
                    const result = await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteStatusGet({ id: r.id });
                    setRouteStatuses(prev => ({ ...prev, [r.id]: result.applied }));
                } catch {
                    setRouteStatuses(prev => ({ ...prev, [r.id]: null }));
                }
            })
        );
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const data = await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteGet({ namespace: selectedNamespace });
            const routeList = (data as any) || [];
            setRoutes(routeList);
            // Kick off background status checks — non-blocking
            fetchAllStatuses(routeList);
        } catch (err) { toast.error("Failed to fetch HTTPRoutes"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (row: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteDelete({ id: row.id });
            toast.success("HTTPRoute deleted");
            fetchRoutes();
        } catch (err) { toast.error("Failed to delete HTTPRoute"); }
    };

    const handleYAMLImport = async (values: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesImportYamlPost({ requestBody: { manifest: values.manifest } });
            toast.success("HTTPRoute imported successfully");
            setYamlImportOpen(false);
            fetchRoutes();
        } catch (error: any) {
            console.error("Import error:", error);
            const detail = error.body?.detail || error.message || "Unknown error";
            toast.error(`Import failed: ${detail}`);
        }
    };

    const handleCheckStatus = useCallback(async (row: any) => {
        setRouteStatuses(prev => ({ ...prev, [row.id]: "checking" }));
        try {
            const result = await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteStatusGet({ id: row.id });
            setRouteStatuses(prev => ({ ...prev, [row.id]: result.applied }));
        } catch {
            setRouteStatuses(prev => ({ ...prev, [row.id]: null }));
            toast.error(`Status check failed for '${row.name}'`);
        }
    }, []);

    const handleApply = async (row: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteApplyPost({ id: row.id });
            toast.success(`Applied '${row.name}' to cluster`);
            setRouteStatuses(prev => ({ ...prev, [row.id]: true }));
        } catch (error: any) {
            const detail = error.body?.detail || error.message || "Unknown error";
            toast.error(`Apply failed: ${detail}`);
        }
    };

    const handleDeleteFromCluster = async (row: any) => {
        try {
            await (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteDeleteFromClusterPost({ id: row.id });
            toast.success(`Removed '${row.name}' from cluster`);
            setRouteStatuses(prev => ({ ...prev, [row.id]: false }));
        } catch (error: any) {
            const detail = error.body?.detail || error.message || "Unknown error";
            toast.error(`Remove from cluster failed: ${detail}`);
        }
    };

    const handleBulkApply = async (rows: any[]) => {
        const results = await Promise.allSettled(
            rows.map(row =>
                (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteApplyPost({ id: row.id })
            )
        );
        const failed = results.filter(r => r.status === "rejected").length;
        if (failed > 0) toast.error(`${failed} of ${rows.length} failed to apply`);
        else { toast.success(`Applied ${rows.length} HTTPRoute(s) to cluster`); }
        rows.forEach(row => setRouteStatuses(prev => ({ ...prev, [row.id]: true })));
    };

    const handleBulkDeleteFromCluster = async (rows: any[]) => {
        const results = await Promise.allSettled(
            rows.map(row =>
                (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteDeleteFromClusterPost({ id: row.id })
            )
        );
        const failed = results.filter(r => r.status === "rejected").length;
        if (failed > 0) toast.error(`${failed} of ${rows.length} failed to remove`);
        else { toast.success(`Removed ${rows.length} HTTPRoute(s) from cluster`); }
        rows.forEach(row => setRouteStatuses(prev => ({ ...prev, [row.id]: false })));
    };

    const handleEdit = (row: any) => {
        setEditMode(true);
        setEditingId(row.id);
        setInitialValues(row);
        setActiveStep("setup");
        setDialogOpen(true);
    };

    const handleView = (row: any) => {
        setInitialValues(row);
        setViewDialogOpen(true);
    };

    const steps = useMemo(() => [
        {
            id: 'setup',
            label: 'Configuration',
            description: 'Link profiles and hostnames',
            longDescription: 'Compose your HTTPRoute by linking metadata, rules, and parent references.',
            component: (props: any) => <DerivedHTTPRouteForm {...props} namespace={selectedNamespace} />
        }
    ], [selectedNamespace]);

    const yamlImportSteps = useMemo(() => [
        {
            id: 'import',
            label: 'Import YAML',
            description: 'Paste Kubernetes YAML',
            longDescription: 'Paste your HTTPRoute YAML manifest here.',
            component: YAMLImportForm,
        },
    ], []);

    return (
        <PageLayout
            title="Derived HTTPRoutes"
            subtitle="Manage complex traffic routing by composing reusable profiles."
            icon={NetworkIcon}
            actions={
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" onClick={fetchRoutes}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setInitialValues({ name: "", namespace: selectedNamespace });
                        setActiveStep("setup");
                        setDialogOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Derived HTTPRoute
                    </Button>
                    <Button variant="outline" onClick={() => setYamlImportOpen(true)}>
                        <FileUp className="w-3.5 h-3.5 mr-2" />
                        Import YAML
                    </Button>
                </div>
            }
        >
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total HTTPRoutes"
                    count={routes.length}
                    icon={<NetworkIcon className="w-4 h-4" />}
                    color="bg-primary"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Applied to Cluster"
                    count={Object.values(routeStatuses).filter(v => v === true).length}
                    icon={<NetworkIcon className="w-4 h-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 mt-4">
                <ResourceTable
                    loading={loading}
                    columns={[
                        { accessor: "name", header: "Name" },
                        { accessor: "display_hostnames", header: "Hostnames" },
                        {
                            accessor: "applied",
                            header: "Cluster Status",
                            cell: (row: any) => {
                                const status = routeStatuses[row.id];
                                if (status === "checking") return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>;
                                if (status === true) return <Badge variant="success" className="gap-1.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />Applied</Badge>;
                                if (status === false) return <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">Not Applied</Badge>;
                                return <Badge variant="secondary" className="gap-1.5 text-xs text-muted-foreground/60">Unknown</Badge>;
                            }
                        },
                    ]}
                    data={routes}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onViewDetails={handleView}
                    onPlay={handleApply}
                    onStop={handleDeleteFromCluster}
                    onBulkPlay={handleBulkApply}
                    onBulkStop={handleBulkDeleteFromCluster}
                    customActions={[
                        {
                            label: "Check Cluster Status",
                            icon: ScanSearch,
                            onClick: handleCheckStatus,
                        }
                    ]}
                />
            </div>

            <FormWizard
                name="httproute-wizard"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeStep}
                setCurrentStep={setActiveStep}
                steps={steps}
                schema={httpRouteSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        if (editMode && editingId) {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttproutePut({ id: editingId, requestBody: values } as any);
                        } else {
                            await (DefaultService as any).apiIntegrationKubernetesLibraryHttproutePost({ requestBody: values } as any);
                        }
                        toast.success(editMode ? "Updated" : "Created");
                        setDialogOpen(false);
                        fetchRoutes();
                    } catch (e) { toast.error("Operation failed"); }
                }}
                submitLabel={editMode ? "Update" : "Create"}
                heading={{
                    primary: editMode ? "Edit HTTPRoute" : "Create HTTPRoute",
                    secondary: "Define a new derived HTTPRoute",
                    icon: NetworkIcon
                }}
            />

            <FormWizard
                name="view-httproute"
                isWizardOpen={viewDialogOpen}
                setIsWizardOpen={setViewDialogOpen}
                currentStep="view"
                setCurrentStep={() => { }}
                steps={[{
                    id: 'view',
                    label: 'View',
                    description: 'View Details',
                    longDescription: 'View the details of the selected HTTPRoute configuration.',
                    component: (props: any) => initialValues ? (
                        <ProfileAdvancedConfig profile={initialValues} profileType={"httproute" as any} />
                    ) : null,
                    hideSectionHeader: true,
                }]}
                schema={httpRouteSchema}
                initialValues={initialValues}
                onSubmit={() => { }}
                submitLabel="Close"
                heading={{
                    primary: "HTTPRoute Details",
                    secondary: "View profile linkages and YAML",
                    icon: NetworkIcon
                }}
                hideActions={true}
            />

            <FormWizard
                name="yaml-import-wizard"
                isWizardOpen={yamlImportOpen}
                setIsWizardOpen={setYamlImportOpen}
                currentStep="import"
                setCurrentStep={() => { }}
                steps={yamlImportSteps}
                schema={yamlImportSchema}
                initialValues={{ manifest: "" }}
                onSubmit={handleYAMLImport}
                submitLabel="Import HTTPRoute"
                submitIcon={FileUp}
                heading={{
                    primary: "Import from YAML",
                    secondary: "Create a new HTTPRoute configuration by parsing a Kubernetes manifest",
                    icon: FileUp,
                }}
            />
        </PageLayout>
    );
}

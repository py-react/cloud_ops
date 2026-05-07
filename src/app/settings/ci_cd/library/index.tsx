import React, { useState, useEffect, useMemo } from 'react';
import useNavigate from "@/libs/navigate";
import { Package, RefreshCw, Plus, Search, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageLayout from '@/components/PageLayout';
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ChartWizard } from '@/components/library/ChartWizard';
import { CommitDialog } from '@/components/library/CommitDialog';
import yaml from 'js-yaml';

interface Chart {
    type: 'template';
    id: string;
    name: string;
    display_name: string;
    template: string;
    actions: string[];
    in_use: boolean;
    showDelete?: boolean;
}

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [charts, setCharts] = useState<Chart[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [chartToDelete, setChartToDelete] = useState<Chart | null>(null);
    const [chartWizardOpen, setChartWizardOpen] = useState(false);
    const [isEditingChart, setIsEditingChart] = useState(false);
    const [initialChartValues, setInitialChartValues] = useState<any>(null);
    const [usageData, setUsageData] = useState<any[]>([]);
    const navigate = useNavigate();

    const fetchCharts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/library');
            const data = await res.json();
            setCharts((data || []).filter((e: any) => e.type === 'template').map((c: any) => ({
                ...c,
                showDelete: true
            })));
        } catch {
            toast.error("Failed to load charts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCharts(); }, []);

    // Commit Dialog & Pending Data state
    const [commitDialogOpen, setCommitDialogOpen] = useState(false);
    const [pendingData, setPendingData] = useState<{ isEditing: boolean; values: any } | null>(null);

    const handleCommitConfirm = async (message: string) => {
        if (!pendingData) return;
        const { isEditing, values } = pendingData;
        
        try {
            if (isEditing) {
                // Update mode
                const filesRes = await fetch(`/api/library/template/files?name=${values.name}`);
                const data = await filesRes.json();
                const existingFiles = data.files || {};
                
                let chartObj: any = {};
                try {
                    chartObj = yaml.load(existingFiles['Chart.yaml'] || '{}');
                } catch (e) {
                    chartObj = {};
                }

                chartObj.name = values.name;
                chartObj.description = values.description;
                chartObj.version = values.version;
                chartObj.appVersion = values.appVersion;

                const res = await fetch('/api/library/template/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template: values.name,
                        files: {
                            ...existingFiles,
                            'Chart.yaml': yaml.dump(chartObj, { indent: 2, lineWidth: -1 })
                        },
                        commit_message: message
                    }),
                });

                if (res.ok) {
                    toast.success("Chart updated");
                    setPendingData(null);
                    fetchCharts();
                } else {
                    const err = await res.json();
                    toast.error(err.detail || "Failed to update chart");
                }
            } else {
                // Create mode
                const res = await fetch('/api/library/template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...values, commit_message: message }),
                });
                if (res.ok) {
                    const data = await res.json();
                    toast.success("Chart created");
                    setPendingData(null);
                    fetchCharts();
                    navigate(`/settings/ci_cd/library/${data.name}`);
                } else {
                    const err = await res.json();
                    toast.error(err.detail || "Failed to create chart");
                }
            }
        } catch (e) {
            toast.error("An error occurred while saving");
        }
    };

    const handleSaveChart = async (values: any) => {
        setPendingData({ isEditing: isEditingChart, values });
        setChartWizardOpen(false);
        setCommitDialogOpen(true);
    };

    const handleEditAction = async (row: Chart) => {
        try {
            const res = await fetch(`/api/library/template/files?name=${row.name}`);
            const data = await res.json();
            const files = data.files || {};
            const chartContent = files['Chart.yaml'] || '';
            
            let chartObj: any = {};
            try {
                chartObj = yaml.load(chartContent);
            } catch (e) {
                chartObj = {};
            }

            setInitialChartValues({
                name: row.name,
                description: chartObj.description || '',
                version: chartObj.version || '0.1.0',
                appVersion: chartObj.appVersion || 'latest'
            });
            setIsEditingChart(true);
            setChartWizardOpen(true);
        } catch {
            toast.error("Failed to load chart details");
        }
    };

    const confirmDelete = async () => {
        if (!chartToDelete) return;
        try {
            await fetch(`/api/library/template?name=${chartToDelete.name}`, { method: 'DELETE' });
            toast.success("Chart deleted");
            fetchCharts();
        } catch {
            toast.error("Failed to delete chart");
        } finally {
            setDeleteDialogOpen(false);
            setChartToDelete(null);
        }
    };

    const filtered = useMemo(() => {
        if (!searchQuery) return charts;
        const q = searchQuery.toLowerCase();
        return charts.filter(c => c.name.toLowerCase().includes(q));
    }, [charts, searchQuery]);

    const columns = [
        {
            header: "Chart Name",
            accessor: "name",
            cell: (row: Chart) => (
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm">
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate tracking-tight">{row.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                            Helm Chart
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Usage",
            accessor: "in_use",
            cell: (row: Chart) => (
                row.in_use ? (
                    <Badge variant="glow" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        In Use
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40">
                        Unused
                    </Badge>
                )
            )
        }
    ];

    return (
        <PageLayout
            title="Charts"
            subtitle="Manage your Helm chart templates and environment configurations"
            icon={Package}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="gradient" size="sm" onClick={() => {
                        setInitialChartValues(null);
                        setIsEditingChart(false);
                        setChartWizardOpen(true);
                    }}>
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        New Chart
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchCharts}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Sync
                    </Button>
                </div>
            }
        >
            <div className="flex-1 min-h-0">
                <ResourceTable
                    title="Charts"
                    description="Click a chart to manage its manifest and environments."
                    data={filtered}
                    columns={columns}
                    loading={loading}
                    onRowClick={(row) => navigate(`/settings/ci_cd/library/${row.name}`)}
                    onEdit={handleEditAction}
                    onDelete={(row) => { 
                        setChartToDelete(row); 
                        if (row.in_use) {
                            fetch(`/api/library/usage?template=${row.name}`)
                                .then(r => r.json())
                                .then(data => setUsageData(data));
                        } else {
                            setUsageData([]);
                        }
                        setDeleteDialogOpen(true); 
                    }}
                    extraHeaderContent={
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search charts..."
                                className="pl-9 h-8 w-[200px] text-sm"
                            />
                        </div>
                    }
                />
            </div>

            {chartWizardOpen && (
                <ChartWizard
                    isOpen={chartWizardOpen}
                    setIsOpen={setChartWizardOpen}
                    onSubmit={handleSaveChart}
                    isEditing={isEditingChart}
                    initialValues={initialChartValues}
                />
            )}

            <CommitDialog
                isOpen={commitDialogOpen}
                onClose={() => { setCommitDialogOpen(false); setPendingData(null); }}
                onConfirm={handleCommitConfirm}
                title={pendingData?.isEditing ? "Commit Metadata Changes" : "Commit New Chart"}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setUsageData([]); setChartToDelete(null); } setDeleteDialogOpen(open); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            {usageData.length > 0 ? "Deletion Restricted" : "Delete Chart?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            {usageData.length > 0 ? (
                                <>
                                    <p className="text-foreground font-medium">
                                        Cannot delete <strong>{chartToDelete?.name}</strong> because it is actively used by the following configurations:
                                    </p>
                                    <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border/40 rounded-lg p-3 bg-muted/20">
                                        {usageData.map((d, i) => (
                                            <a 
                                                key={i}
                                                href={`/settings/ci_cd/release_config/${d.namespace}/${d.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-2 rounded-md hover:bg-primary/5 border border-border/30 bg-card transition-colors group"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-foreground group-hover:text-primary">{d.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.namespace}</span>
                                                </div>
                                                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                            </a>
                                        ))}
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                            Please delete or re-configure these release settings before removing this chart.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>Are you sure you want to permanently delete <strong>{chartToDelete?.name}</strong>?</p>
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                            This removes the chart and all associated environment configurations.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={usageData.length > 0}
                            className={usageData.length > 0 ? "opacity-50 grayscale cursor-not-allowed" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Chart
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
}
import React, { useState, useEffect, useContext } from 'react';
import { Globe, RefreshCw, Plus, ChevronRight, Package, LayoutTemplate, Trash2, Edit, Settings, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext';
import PageLayout from '@/components/PageLayout';
import useNavigate from "@/libs/navigate";
import { EnvironmentWizard } from '@/components/library/EnvironmentWizard';
import { ManifestWizard } from '@/components/library/ManifestWizard';
import { DefaultsWizard } from '@/components/library/DefaultsWizard';
import { CommitDialog } from '@/components/library/CommitDialog';
import { useLocation } from 'react-router-dom';

interface ChartDetailProps {
    templateName: string;
    files: Record<string, string>;
    environments: any[];
    error?: string;
}

const ChartDetail: React.FC<ChartDetailProps> = ({ templateName, files: initialFiles, environments: initialEnvironments, error }) => {
    const { selectedNamespace } = useContext(NamespaceContext);
    const location = useLocation();
    const search = location.search
    const queryParams = new URLSearchParams(search);
    const selectedEnv = queryParams.get('selectedenv');
    // Wizards state
    const [manifestWizardOpen, setManifestWizardOpen] = useState(false);
    const [defaultsWizardOpen, setDefaultsWizardOpen] = useState(false);
    const [currentFiles, setCurrentFiles] = useState<Record<string, string>>(initialFiles || {});

    // Environments state
    const [environments, setEnvironments] = useState<any[]>(initialEnvironments || []);
    const [envWizardOpen, setEnvWizardOpen] = useState(false);
    const [isEditingEnv, setIsEditingEnv] = useState(false);
    const [editingEnv, setEditingEnv] = useState('');
    const [editingValues, setEditingValues] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [envToDelete, setEnvToDelete] = useState<any>(null);
    const [usageData, setUsageData] = useState<any[]>([]);

    // Commit Dialog & Pending Data state
    const [commitDialogOpen, setCommitDialogOpen] = useState(false);
    const [pendingData, setPendingData] = useState<{ type: 'manifest' | 'defaults' | 'env'; data: any } | null>(null);

    useEffect(() => { if (error) toast.error(`Error: ${error}`); }, [error]);

    const handleCommitConfirm = async (message: string) => {
        if (!pendingData) return;
        const { type, data } = pendingData;

        try {
            let res;
            if (type === 'manifest') {
                res = await fetch('/api/library/template/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template: templateName,
                        files: { ...currentFiles, 'templates/app.yaml': data.content },
                        commit_message: message
                    }),
                });
            } else if (type === 'defaults') {
                res = await fetch('/api/library/template/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template: templateName,
                        files: { ...currentFiles, 'values.yaml': data.content },
                        commit_message: message
                    }),
                });
            } else if (type === 'env') {
                res = await fetch('/api/library/values', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template: templateName,
                        env_name: data.env_name,
                        values_yaml: data.values,
                        message: message || `Update ${templateName}/${data.env_name}`,
                    }),
                });
            }

            if (res && res.ok) {
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved`);
                setPendingData(null);
                refreshData();
            } else {
                const err = await (res?.json().catch(() => ({})) || {});
                toast.error(err.detail || `Failed to save ${type}`);
            }
        } catch (e) {
            toast.error("An error occurred while saving");
        }
    };

    const handleSaveManifest = async (data: { content: string }) => {
        setPendingData({ type: 'manifest', data });
        setManifestWizardOpen(false);
        setCommitDialogOpen(true);
    };

    const handleSaveDefaults = async (data: { content: string }) => {
        setPendingData({ type: 'defaults', data });
        setDefaultsWizardOpen(false);
        setCommitDialogOpen(true);
    };

    const handleSaveEnv = async (data: any) => {
        setPendingData({ type: 'env', data });
        setEnvWizardOpen(false);
        setCommitDialogOpen(true);
    };

    useEffect(() => {
        if (selectedEnv) {
            setEditingEnv(selectedEnv);
            setIsEditingEnv(true);
            fetch(`/api/library/values/content?template=${templateName}&env_name=${selectedEnv}`)
                .then(r => r.ok ? r.text() : Promise.reject())
                .then(text => {
                    setEditingValues(text);
                    setEnvWizardOpen(true);
                })
                .catch(() => toast.error('Failed to load environment'));
        }
    }, [selectedEnv, search]);

    const refreshData = async () => {
        try {
            // Refresh environments
            const envsRes = await fetch(`/api/library/values?template=${templateName}`);
            if (envsRes.ok) setEnvironments(await envsRes.json());

            // Refresh files (for wizards prefill)
            const filesRes = await fetch(`/api/library/template/files?name=${templateName}`);
            if (filesRes.ok) {
                const data = await filesRes.json();
                setCurrentFiles(data.files || {});
            }
        } catch { toast.error("Failed to refresh data"); }
    };

    const confirmDeleteEnv = async () => {
        if (!envToDelete) return;
        try {
            const res = await fetch(`/api/library/values?template=${templateName}&env_name=${envToDelete.env_name}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Environment deleted');
                refreshData();
            } else {
                toast.error('Failed to delete');
            }
        } catch { toast.error('Failed to delete'); }
        finally { setDeleteDialogOpen(false); setEnvToDelete(null); }
    };

    const envColumns = [
        {
            header: "Environment",
            accessor: "env_name",
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                        <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight">{row.env_name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Value Override</span>
                    </div>
                </div>
            )
        },
        {
            header: "Format",
            accessor: "format",
            cell: () => <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">YAML</span>
        },
        {
            header: "Usage",
            accessor: "in_use",
            cell: (row: any) => (
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
            title={templateName}
            subtitle={
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                    <span>Charts</span>
                    <ChevronRight className="w-3 h-3 text-primary/30" />
                    <span className="text-primary font-black">{templateName}</span>
                </div>
            }
            icon={Package}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setDefaultsWizardOpen(true)}>
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Edit Defaults
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setManifestWizardOpen(true)}>
                        <LayoutTemplate className="w-3.5 h-3.5 mr-2" />
                        Edit Manifest
                    </Button>
                    <Button variant="outline" size="sm" onClick={refreshData}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Sync
                    </Button>
                </div>
            }
        >
            <div className="flex-1 min-h-0">
                <ResourceTable
                    title="Environments"
                    description={`Per-environment value overrides for ${templateName}`}
                    data={environments.map(e => ({ ...e, showDelete: true }))}
                    columns={envColumns}
                    onEdit={(row: any) => {
                        setEditingEnv(row.env_name);
                        setIsEditingEnv(true);
                        fetch(`/api/library/values/content?template=${templateName}&env_name=${row.env_name}`)
                            .then(r => r.ok ? r.text() : Promise.reject())
                            .then(text => { setEditingValues(text); setEnvWizardOpen(true); })
                            .catch(() => toast.error('Failed to load environment'));
                    }}
                    onDelete={(row: any) => {
                        setEnvToDelete(row);
                        if (row.in_use) {
                            fetch(`/api/library/usage?template=${templateName}&env_name=${row.env_name}`)
                                .then(r => r.json())
                                .then(data => setUsageData(data));
                        } else {
                            setUsageData([]);
                        }
                        setDeleteDialogOpen(true);
                    }}
                    extraHeaderContent={
                        <Button size="sm" variant="default" onClick={() => {
                            setEditingEnv(''); setEditingValues('');
                            setIsEditingEnv(false); setEnvWizardOpen(true);
                        }}>
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Add Environment
                        </Button>
                    }
                />
            </div>

            <EnvironmentWizard
                isOpen={envWizardOpen}
                setIsOpen={(open) => { setEnvWizardOpen(open); if (!open) setIsEditingEnv(false); }}
                templateName={templateName}
                initialValues={{ env_name: editingEnv, values: editingValues }}
                onSubmit={handleSaveEnv}
                selectedNamespace={selectedNamespace || ''}
                isEditing={isEditingEnv}
            />

            <ManifestWizard
                isOpen={manifestWizardOpen}
                setIsOpen={setManifestWizardOpen}
                chartName={templateName}
                initialContent={currentFiles['templates/app.yaml'] || ''}
                onSubmit={handleSaveManifest}
            />

            <DefaultsWizard
                isOpen={defaultsWizardOpen}
                setIsOpen={setDefaultsWizardOpen}
                chartName={templateName}
                initialContent={currentFiles['values.yaml'] || ''}
                onSubmit={handleSaveDefaults}
            />

            <CommitDialog
                isOpen={commitDialogOpen}
                onClose={() => { setCommitDialogOpen(false); setPendingData(null); }}
                onConfirm={handleCommitConfirm}
                title={
                    pendingData?.type === 'manifest' ? "Commit Manifest Changes" :
                        pendingData?.type === 'defaults' ? "Commit Default Values" :
                            pendingData?.type === 'env' ? `Commit ${pendingData.data?.env_name} Overrides` :
                                "Commit Changes"
                }
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setUsageData([]); setEnvToDelete(null); } setDeleteDialogOpen(open); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            {usageData.length > 0 ? "Deletion Restricted" : "Delete Environment?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            {usageData.length > 0 ? (
                                <>
                                    <p className="text-foreground font-medium">
                                        Cannot delete environment <strong>{envToDelete?.env_name}</strong> because it is actively used by:
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
                                            Please delete or re-configure these release settings before removing this environment.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>Are you sure you want to permanently delete <strong>{envToDelete?.env_name}</strong>?</p>
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                            This cannot be undone via the UI.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteEnv}
                            disabled={usageData.length > 0}
                            className={usageData.length > 0 ? "opacity-50 grayscale cursor-not-allowed" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
};

export default ChartDetail;

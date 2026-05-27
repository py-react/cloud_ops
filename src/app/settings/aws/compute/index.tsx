import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Cpu,
    Plus,
    RefreshCw,
    Server,
    AlertTriangle,
    Trash2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import PageLayout from '@/components/PageLayout';
import { AWSCredentialSelector } from '@/components/aws/AWSCredentialSelector';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import useNavigate from '@/libs/navigate';
import { CreateEC2Wizard, type CreateEC2Values } from '@/components/aws/compute/CreateEC2Wizard';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

import { Copy, Check } from 'lucide-react';

function DeleteConfirmModal({ open, onClose, resourceName, onConfirm, loading }: {
    open: boolean; onClose: () => void; resourceName: string; onConfirm: () => void; loading: boolean;
}) {
    const [inputValue, setInputValue] = useState('');
    const isValid = inputValue === resourceName;
    useEffect(() => { if (open) setInputValue(''); }, [open]);
    return (
        <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="w-5 h-5" /></div>
                        <AlertDialogTitle className="text-lg">Delete EC2 Instance</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p>This will <strong>permanently terminate</strong> the instance and clean up attached volumes, snapshots, and Elastic IPs.</p>
                        <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type the instance name to confirm:</p>
                            <p className="font-mono text-sm font-bold text-foreground">{resourceName}</p>
                        </div>
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={`Type "${resourceName}"`} className="font-mono text-sm" autoFocus />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={!isValid || loading} onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete Instance
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center border bg-background"
            title="Copy to clipboard"
        >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </button>
    );
};

interface EC2Instance {
    instance_id: string;
    name: string;
    state: string;
    instance_type: string;
    availability_zone: string;
    private_ip: string;
    public_ip: string;
    launch_time: string;
    region: string;
}

const instanceColumns = [
    {
        header: "Instance Name",
        accessor: "name",
        cell: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
                    <Cpu className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-foreground">{row.name}</span>
            </div>
        )
    },
    {
        header: "State",
        accessor: "state",
        cell: (row: any) => {
            switch (row.state) {
                case 'running': return <Badge variant="success" className="text-[10px] font-black uppercase">RUNNING</Badge>;
                case 'pending': return <Badge variant="warning" className="text-[10px] font-black uppercase animate-pulse">PENDING</Badge>;
                case 'stopped': return <Badge variant="outline" className="text-[10px] font-black uppercase">STOPPED</Badge>;
                case 'stopping': return <Badge variant="warning" className="text-[10px] font-black uppercase animate-pulse">STOPPING</Badge>;
                case 'terminated': return <Badge variant="destructive" className="text-[10px] font-black uppercase">TERMINATED</Badge>;
                default: return <Badge variant="outline" className="text-[10px] font-black uppercase">{row.state}</Badge>;
            }
        }
    },
    { header: "Type", accessor: "instance_type" },
    { header: "AZ", accessor: "availability_zone" },
    { header: "Region", accessor: "region", cell: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.region || '—'}</span> },
    {
        header: "Public IP",
        accessor: "public_ip",
        cell: (row: any) => (
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground font-semibold">{row.public_ip || '—'}</span>
                {row.public_ip && (
                    <CopyButton value={row.public_ip} />
                )}
            </div>
        )
    },
];

const NO_EXTRAS = { showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false };

export default function ComputeOrchestrator() {
    const { selectedAwsCredential } = useAWS();
    const navigate = useNavigate();
    const [instances, setInstances] = useState<EC2Instance[]>([]);
    const [fetchingResources, setFetchingResources] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; instance: EC2Instance | null; loading: boolean }>({ open: false, instance: null, loading: false });

    const fetchInstances = useCallback(async () => {
        if (!selectedAwsCredential?.id) return;
        setFetchingResources(true);
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        try {
            const url = `/api/v1/aws/compute/instances?credential_id=${credId}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setInstances(data.instances || []);
        } catch {
            toast.error('Failed to sync EC2 instances');
        } finally { setFetchingResources(false); }
    }, [selectedAwsCredential?.id]);

    useEffect(() => {
        if (selectedAwsCredential?.id) {
            setHasLoaded(false);
            const doFetch = async () => {
                await fetchInstances();
                setHasLoaded(true);
            };
            doFetch();
        } else {
            setInstances([]);
            setHasLoaded(false);
        }
    }, [selectedAwsCredential?.id, fetchInstances]);

    const handleCreate = async (values: CreateEC2Values) => {
        if (!selectedAwsCredential?.id) return;
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        const tagObj: Record<string, string> = {};
        (values.tags || []).filter(t => t.key.trim()).forEach(t => { tagObj[t.key.trim()] = t.value.trim(); });

        try {
            const res = await fetch(`/api/v1/aws/compute/instances?credential_id=${credId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    instance_name: values.instance_name.trim(),
                    region: values.region,
                    image_id: values.image_id,
                    instance_type: values.instance_type,
                    key_name: values.key_name || undefined,
                    subnet_id: values.subnet_id || undefined,
                    security_group_ids: values.security_group_id ? [values.security_group_id] : [],
                    bastion_enabled: values.bastion_enabled,
                    tags: Object.keys(tagObj).length ? tagObj : {},
                })
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.detail || 'Failed to create instance');
            else if (data.status === 'error') toast.error(data.message);
            else {
                toast.success('Instance provisioning queued');
                setShowWizard(false);
                fetchInstances();
            }
        } catch { toast.error('Failed to create instance'); }
    };

    const vmAction = async (instance: EC2Instance, action: 'start' | 'stop' | 'delete') => {
        if (!selectedAwsCredential?.id) return;
        setFetchingResources(true);
        setInstances(prev => prev.map(i =>
            i.instance_id === instance.instance_id
                ? { ...i, state: action === 'delete' ? 'terminated' : action === 'start' ? 'pending' : 'stopping' }
                : i
        ));
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        try {
            const url = action === 'delete'
                ? `/api/v1/aws/compute/instances/${instance.instance_id}?credential_id=${credId}&region=${encodeURIComponent(instance.region)}`
                : `/api/v1/aws/compute/instances/${instance.instance_id}/${action}?credential_id=${credId}&region=${encodeURIComponent(instance.region)}`;
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            toast.success(data.message || `VM ${action} queued`);
            if (action === 'delete') setSelectedInstance(null);
            await fetchInstances();
        } catch {
            toast.error(`Failed to ${action} VM`);
            await fetchInstances();
        } finally {
            setFetchingResources(false);
        }
    };

    return (
        <PageLayout
            title="Compute Engines"
            subtitle="Manage and provision EC2 virtual machines."
            icon={Cpu}
            actions={
                <div className="flex items-center gap-2">
                    <AWSCredentialSelector />
                    <Button
                        variant="outline" size="sm"
                        onClick={fetchInstances}
                        disabled={fetchingResources}
                        className="h-9 font-bold uppercase tracking-tight text-[10px]"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${fetchingResources ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button size="sm" onClick={() => setShowWizard(true)}
                        className="font-black text-[10px] uppercase tracking-widest px-6 h-9">
                        <Plus className="w-3.5 h-3.5 mr-2" /> Create Instance
                    </Button>
                </div>
            }
        >
            <div className="pt-4 space-y-6">
                {!hasLoaded ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Cpu className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Orchestrating Compute Resources...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <ResourceTable
                            title="EC2 Instances"
                            description={`${instances.length} instances`}
                            icon={<Cpu className="w-5 h-5 text-primary" />}
                            columns={instanceColumns}
                            data={instances.map(i => ({ ...i, ...NO_EXTRAS, showViewDetails: true, showDelete: true }))}
                            loading={fetchingResources}
                            onViewDetails={(i) => { const inst = i as EC2Instance; navigate(`/settings/aws/compute/instances/${inst.instance_id}?region=${encodeURIComponent(inst.region)}`); }}
                            onDelete={(i) => setDeleteModal({ open: true, instance: (i as EC2Instance), loading: false })}
                        />
                    </div>
                )}
            </div>
            <DeleteConfirmModal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, instance: null, loading: false })}
                resourceName={deleteModal.instance?.name || ''}
                onConfirm={async () => {
                    const inst = deleteModal.instance;
                    if (!inst) return;
                    setDeleteModal(prev => ({ ...prev, loading: true }));
                    await vmAction(inst, 'delete');
                    setDeleteModal({ open: false, instance: null, loading: false });
                }}
                loading={deleteModal.loading}
            />
            <CreateEC2Wizard
                isWizardOpen={showWizard}
                setIsWizardOpen={setShowWizard}
                onSubmit={handleCreate}
            />
        </PageLayout>
    );
}

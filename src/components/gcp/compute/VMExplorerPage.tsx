import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Cpu, Play, Square, RefreshCw, Trash2, ArrowLeft,
    Terminal, Info, Loader2, DollarSign, TrendingUp,
    Network, HardDrive, Shield, RotateCcw, AlertTriangle,
    Key, Eye, EyeOff, CheckCircle, Copy, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import useNavigate from '@/libs/navigate';

interface VMInstance {
    id: number | null;
    instance_name: string;
    zone: string;
    machine_type: string;
    boot_disk_size_gb: number;
    gcp_resource_id: string;
    status: string;
    external_ip: string | null;
    creation_timestamp: string;
    description: string;
    disks?: any[];
    network_interfaces?: any[];
    ssh_username: string;
    has_onboarding_password: boolean;
    onboarding_username: string | null;
    onboarding_password: string | null;
}

function DeleteConfirmModal({ open, onClose, instanceName, onConfirm, loading }: {
    open: boolean; onClose: () => void; instanceName: string; onConfirm: () => void; loading: boolean;
}) {
    const [inputValue, setInputValue] = useState('');
    useEffect(() => { if (open) setInputValue(''); }, [open]);
    return (
        <AlertDialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <AlertDialogTitle>Delete VM Instance</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p>This will <strong>permanently delete</strong> the VM and wipe the database record.</p>
                        <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type the instance name to confirm:</p>
                            <p className="font-mono text-sm font-bold text-foreground">{instanceName}</p>
                        </div>
                        <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={`Type "${instanceName}"`} className="font-mono text-sm" autoFocus />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={inputValue !== instanceName || loading} onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete Instance
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function OnboardingPasswordCard({ instance, instanceName, onPurgeComplete }: {
    instance: VMInstance | null;
    instanceName: string;
    onPurgeComplete: () => void;
}) {
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [purging, setPurging] = useState(false);

    const handleReveal = async () => {
        setRevealed(true);
    };

    const handleCopy = async () => {
        if (!instance?.onboarding_password) return;
        const username = instance.onboarding_username || instance.ssh_username || 'admin';
        const text = `Username: ${username}\nPassword: ${instance.onboarding_password}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        await purgePassword();
    };

    const handleClose = async () => {
        setRevealed(false);
        await purgePassword();
    };

    const purgePassword = async () => {
        if (!instanceName) return;
        setPurging(true);
        const token = getAuthToken();
        try {
            await fetch(
                `/api/v1/gcp/compute/instances/${instanceName}/purge-password`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
            );
            onPurgeComplete();
        } catch {
            toast.error('Failed to purge onboarding password');
        } finally {
            setPurging(false);
        }
    };

    if (!instance?.has_onboarding_password) {
        return (
            <div className="border rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Credentials Purged</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Admin onboarding credentials have been securely viewed and cleared from local records.
                    Access is now managed exclusively through your active Bastion proxy configurations.
                </p>
            </div>
        );
    }

    if (revealed) {
        return (
            <div className="border rounded-lg bg-card p-4 space-y-3 border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-700">Onboarding Credentials</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {copied && <span className="text-[10px] text-emerald-600 font-bold mr-1">Copied!</span>}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClose} disabled={purging}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="bg-white rounded-md p-2 border border-amber-200">
                        <span className="text-[10px] text-muted-foreground">Username</span>
                        <p className="font-mono text-sm font-bold">{instance.onboarding_username || instance.ssh_username || 'admin'}</p>
                    </div>
                    <div className="bg-white rounded-md p-2 border border-amber-200">
                        <span className="text-[10px] text-muted-foreground">Password</span>
                        <p className="font-mono text-sm font-bold break-all">{instance.onboarding_password}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-[10px] font-bold uppercase"
                    onClick={handleCopy}
                    disabled={purging}
                >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copied ? 'Copied & Purged' : 'Copy & Purge Credentials'}
                </Button>
                <p className="text-[10px] text-amber-600 font-bold text-center">
                    Credentials will be permanently deleted after copying or closing
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg bg-card p-4 space-y-3 border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-700">Onboarding Password Available</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                Temporary admin credentials were generated during VM provisioning.
                Reveal them once to complete initial setup, then they will be permanently deleted.
            </p>
            <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-[10px] font-bold uppercase border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={handleReveal}
            >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Reveal Onboarding Password
            </Button>
        </div>
    );
}

function SSHConnectionHUD({ instance, projectId }: { instance: VMInstance | null; projectId: string }) {
    const ip = instance?.external_ip || '[EXTERNAL_IP]';
    const name = instance?.instance_name || '[INSTANCE]';
    const zone = instance?.zone || '[ZONE]';
    const sshUser = instance?.ssh_username || 'admin';
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-widest">SSH & Connection Guide</span>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection Details</p>
                <div className="space-y-1.5">
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">Instance Name</span>
                        <p className="font-mono text-sm font-bold">{name}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">SSH Username</span>
                        <p className="font-mono text-sm font-bold">{sshUser}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">External IP</span>
                        <p className="font-mono text-sm font-bold">{ip}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">Zone</span>
                        <p className="font-mono text-sm font-bold">{zone}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">Project</span>
                        <p className="font-mono text-sm font-bold">{projectId}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Native SSH</p>
                <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`ssh -i ~/.ssh/google_compute_engine \\
  ${sshUser}@${ip}`}</pre>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">gcloud SDK</p>
                <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`gcloud compute ssh ${name} \\
  --zone=${zone} \\
  --project=${projectId}`}</pre>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SCP File Transfer</p>
                <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`gcloud compute scp ./local_file.txt \\
  ${name}:/home/${sshUser}/ \\
  --zone=${zone}`}</pre>
            </div>
        </div>
    );
}

export interface VMExplorerPageProps {
    backRoute: string;
}

export function VMExplorerPage({ backRoute }: VMExplorerPageProps) {
    const { instance_name } = useParams<{ instance_name: string }>();
    const searchParams = new URLSearchParams(window.location.search);
    const zoneFromUrl = searchParams.get('zone');
    const navigate = useNavigate();
    const { selectedGcpCredential } = useGCP();

    const [instance, setInstance] = useState<VMInstance | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [hudCollapsed, setHudCollapsed] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    const fetchInstance = useCallback(async () => {
        if (!instance_name || !selectedGcpCredential?.id) return;
        setLoading(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        try {
            const url = zoneFromUrl
                ? `/api/v1/gcp/compute/instances/${instance_name}?project_id=${projectId}&credential_id=${credId}&zone=${zoneFromUrl}`
                : `/api/v1/gcp/compute/instances/${instance_name}?project_id=${projectId}&credential_id=${credId}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') {
                toast.error(data.message || 'Failed to load instance');
            } else {
                setInstance(data);
            }
        } catch {
            toast.error('Failed to sync VM state');
        } finally {
            setLoading(false);
        }
    }, [instance_name, selectedGcpCredential?.id, selectedGcpCredential?.project_id]);

    useEffect(() => { fetchInstance(); }, [fetchInstance]);

    const vmAction = async (action: 'start' | 'stop' | 'reset' | 'delete') => {
        if (!selectedGcpCredential?.id || !instance_name) return;
        setActionLoading(true);

        if (action === 'delete') {
            navigate(backRoute);
        } else {
            setInstance(prev => prev ? {
                ...prev,
                status: action === 'start' ? 'PROVISIONING' : action === 'stop' ? 'STOPPING' : 'RESETTING'
            } : prev);
        }

        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        const zoneParam = zoneFromUrl || instance?.zone || '';
        try {
            const url = action === 'delete'
                ? `/api/v1/gcp/compute/instances/${instance_name}?project_id=${projectId}&credential_id=${credId}&zone=${zoneParam}`
                : `/api/v1/gcp/compute/instances/${instance_name}/${action}?project_id=${projectId}&credential_id=${credId}&zone=${zoneParam}`;
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') {
                fetchInstance();
                toast.error(data.message);
            } else {
                toast.success(`VM ${action} queued`);
                if (action !== 'delete') {
                    setTimeout(fetchInstance, 2000);
                }
            }
        } catch {
            fetchInstance();
            toast.error(`Failed to ${action} VM`);
        } finally {
            setActionLoading(false);
            setDeleteModal(false);
        }
    };

    const statusColor = instance?.status === 'RUNNING'
        ? 'bg-emerald-500'
        : instance?.status === 'TERMINATED'
        ? 'bg-slate-400'
        : instance?.status === 'PROVISIONING' || instance?.status === 'STOPPING' || instance?.status === 'RESETTING'
        ? 'bg-amber-500'
        : 'bg-amber-500';

    const projectId = selectedGcpCredential?.project_id || '';
    const internalIp = instance?.network_interfaces?.[0]?.ip || '—';
    const bootDisk = instance?.disks?.find((d: any) => d.boot);

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top control bar */}
            <div className="border-b bg-card px-6 py-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(backRoute)} className="h-9 w-9 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white border">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black font-mono">{instance_name}</h1>
                                <p className="text-xs text-muted-foreground">
                                    VM Instance · {instance?.zone || '—'} · {projectId}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => vmAction('start')}
                            disabled={actionLoading || instance?.status === 'RUNNING' || instance?.status === 'STOPPING' || instance?.status === 'PROVISIONING'}>
                            <Play className="w-3.5 h-3.5 mr-1.5" /> Start
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => vmAction('stop')}
                            disabled={actionLoading || instance?.status === 'TERMINATED' || instance?.status === 'STOPPING' || instance?.status === 'PROVISIONING'}>
                            <Square className="w-3.5 h-3.5 mr-1.5" /> Stop
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => vmAction('reset')}
                            disabled={actionLoading || instance?.status !== 'RUNNING'}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase text-red-600"
                            onClick={() => setDeleteModal(true)}
                            disabled={actionLoading || instance?.status === 'STOPPING' || instance?.status === 'PROVISIONING'}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={fetchInstance}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Info cards row — mirror StorageExplorerPage */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Status card */}
                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live Status</span>
                        </div>
                        {loading ? (
                            <div className="h-6 bg-muted rounded animate-pulse" />
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${statusColor} ${instance?.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                                    <Badge variant={instance?.status === 'RUNNING' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">
                                        {instance?.status || 'UNKNOWN'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Machine</span>
                                    <span className="font-mono font-bold">{instance?.machine_type || '—'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Boot Disk</span>
                                    <span className="font-mono font-bold">{instance?.boot_disk_size_gb || bootDisk?.size_gb || '—'} GB</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Network card */}
                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Network</span>
                        </div>
                        {loading ? (
                            <div className="h-6 bg-muted rounded animate-pulse" />
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">External IP</span>
                                    <span className="font-mono font-bold">{instance?.external_ip || 'None'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Internal IP</span>
                                    <span className="font-mono font-bold">{internalIp}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Network</span>
                                    <span className="font-mono font-bold">{instance?.network_interfaces?.[0]?.network || 'default'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions card */}
                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</span>
                        </div>
                        <div className="space-y-1.5">
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs"
                                onClick={() => navigate(backRoute)}>
                                <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Compute Engine
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs"
                                onClick={fetchInstance} disabled={loading}>
                                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Live State
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content + HUD */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main: terminal-style console info */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Onboarding Password Card */}
                    <OnboardingPasswordCard
                        instance={instance}
                        instanceName={instance_name || ''}
                        onPurgeComplete={fetchInstance}
                    />

                    {/* Spec grid */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Infrastructure Baseline</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'GCP Resource ID', value: instance?.gcp_resource_id || '—', mono: true },
                                { label: 'Instance Name', value: instance_name || '—', mono: true },
                                { label: 'Zone', value: instance?.zone || '—', mono: true },
                                { label: 'Machine Type', value: instance?.machine_type || '—', mono: true },
                                { label: 'Boot Disk (GB)', value: String(instance?.boot_disk_size_gb || bootDisk?.size_gb || '—'), mono: true },
                                { label: 'Provisioned At', value: instance?.creation_timestamp ? new Date(instance.creation_timestamp).toLocaleString() : '—' },
                            ].map((f) => (
                                <div key={f.label} className="border rounded-lg p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{f.label}</p>
                                    {f.mono
                                        ? <code className="text-xs font-mono bg-muted/40 px-2 py-1.5 rounded-md block break-all">{f.value}</code>
                                        : <p className="text-sm font-semibold">{f.value}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attached Disks */}
                    {(instance?.disks?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Attached Disks</p>
                            <div className="border rounded-lg divide-y">
                                {instance!.disks!.map((disk: any, i: number) => (
                                    <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            <span className="font-mono font-bold truncate">{disk.device_name}</span>
                                        </div>
                                        <span className="text-muted-foreground">{disk.type_?.split('/')[-1] || disk.type || '—'}</span>
                                        <span className="font-bold">{disk.disk_size_gb || disk.size_gb || '—'} GB</span>
                                        <Badge variant={disk.boot ? 'default' : 'outline'} className="text-[10px] w-fit">
                                            {disk.boot ? 'Boot' : 'Data'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Terminal console placeholder */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Machine Console</p>
                        <div className="rounded-lg border bg-slate-950 p-4 space-y-2 min-h-[200px]">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                <div className="h-3 w-3 rounded-full bg-amber-500" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] text-slate-400 ml-2 font-mono">{instance_name} — bash</span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-300 space-y-1 leading-relaxed">
                                <p><span className="text-emerald-400">user@{instance_name}</span><span className="text-slate-400">:~$</span></p>
                                <p className="text-slate-400 text-[10px] italic">Use the SSH commands in the Integration panel →</p>
                                <p className="text-slate-400 text-[10px] italic">Or connect via: gcloud compute ssh {instance_name} --zone={instance?.zone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right HUD — mirroring StorageExplorerPage */}
                <div className={`border-l bg-card overflow-y-auto shrink-0 transition-all ${hudCollapsed ? 'w-10' : 'w-80'}`}>
                    {hudCollapsed ? (
                        <Button variant="ghost" size="sm" className="h-full w-full rounded-none" onClick={() => setHudCollapsed(false)}>
                            <Terminal className="w-4 h-4" />
                        </Button>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs font-black uppercase tracking-widest">SSH Integration</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHudCollapsed(true)}>
                                    <Info className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <SSHConnectionHUD instance={instance} projectId={projectId} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmModal
                open={deleteModal}
                onClose={() => setDeleteModal(false)}
                instanceName={instance_name || ''}
                onConfirm={() => vmAction('delete')}
                loading={actionLoading}
            />
        </div>
    );
}

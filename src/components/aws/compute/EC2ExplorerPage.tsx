import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Cpu, Play, Square, Trash2, RefreshCw, ArrowLeft,
    BadgeCheck, AlertTriangle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DefaultService } from '@/gingerJs_api_client';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import useNavigate from '@/libs/navigate';

interface EC2InstanceDetail {
    instance_id: string;
    name: string;
    state: string;
    instance_type: string;
    availability_zone: string;
    private_ip: string;
    public_ip: string;
    launch_time: string;
    image_id: string;
    key_name: string;
    security_groups: string[];
    tags: Record<string, string>;
}

interface EC2ExplorerPageProps {
    backRoute: string;
}

export function EC2ExplorerPage({ backRoute }: EC2ExplorerPageProps) {
    const { instance_id } = useParams<{ instance_id: string }>();
    const [searchParams] = useSearchParams();
    const region = searchParams.get('region') || '';
    const navigate = useNavigate();
    const { selectedAwsCredential } = useAWS();

    const [instance, setInstance] = useState<EC2InstanceDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    const fetchInstance = useCallback(async () => {
        if (!instance_id || !selectedAwsCredential?.id) return;
        setLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsComputeInstancesInstanceIdGet({ credentialId: String(credId), instanceId: instance_id, region });
            if (data.error) {
                toast.error(data.message || 'Failed to load instance');
                return;
            }
            setInstance(data);
        } catch {
            toast.error('Failed to load instance');
        } finally {
            setLoading(false);
        }
    }, [instance_id, selectedAwsCredential?.id]);

    useEffect(() => { fetchInstance(); }, [fetchInstance]);

    const vmAction = async (action: 'start' | 'stop' | 'delete') => {
        if (!instance_id || !selectedAwsCredential?.id) return;
        setActionLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            let data: any;
            if (action === 'start') {
                data = await DefaultService.apiV1AwsComputeInstancesInstanceIdStartPost({ credentialId: String(credId), instanceId: instance_id, region });
            } else if (action === 'stop') {
                data = await DefaultService.apiV1AwsComputeInstancesInstanceIdStopPost({ credentialId: String(credId), instanceId: instance_id, region });
            } else {
                data = await DefaultService.apiV1AwsComputeInstancesInstanceIdDelete({ credentialId: String(credId), instanceId: instance_id, region });
            }
            toast.success(data.message || `Instance ${action} queued`);
            if (action === 'delete') {
                navigate(backRoute);
                return;
            }
            await fetchInstance();
        } catch {
            toast.error(`Failed to ${action} instance`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !instance) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                <Cpu className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Instance Details...</p>
            </div>
        );
    }

    if (!instance) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground">Instance not found</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(backRoute)}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
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
                                <h1 className="text-lg font-black font-mono">{instance.name}</h1>
                                <p className="text-xs text-muted-foreground">EC2 Instance · {instance.instance_id}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline" size="sm"
                            className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => vmAction('start')}
                            disabled={instance.state === 'running' || instance.state === 'pending' || actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />} Start
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => vmAction('stop')}
                            disabled={instance.state === 'stopped' || instance.state === 'stopping' || instance.state === 'terminated' || actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Square className="w-3.5 h-3.5 mr-1.5" />} Stop
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="h-8 text-[10px] font-bold uppercase text-red-600"
                            onClick={() => setDeleteModal(true)}
                            disabled={instance.state === 'terminated' || actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />} Terminate
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={fetchInstance}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</p>
                        <Badge variant={instance.state === 'running' ? 'success' : instance.state === 'stopped' ? 'outline' : 'warning'} className="text-xs font-bold uppercase">
                            {instance.state}
                        </Badge>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</p>
                        <p className="font-mono font-bold">{instance.instance_type}</p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Availability Zone</p>
                        <p className="font-mono font-bold">{instance.availability_zone}</p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Launch Time</p>
                        <p className="font-mono text-sm">{instance.launch_time ? new Date(instance.launch_time).toLocaleString() : '—'}</p>
                    </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Network</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground">Private IP</p>
                            <p className="font-mono font-bold">{instance.private_ip || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Public IP</p>
                            <p className="font-mono font-bold">{instance.public_ip || '—'}</p>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Configuration</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground">Image ID</p>
                            <p className="font-mono font-bold text-sm">{instance.image_id || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Key Name</p>
                            <p className="font-mono font-bold">{instance.key_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Security Groups</p>
                            <p className="font-mono font-bold">{instance.security_groups?.join(', ') || '—'}</p>
                        </div>
                    </div>
                </div>

                {instance.tags && Object.keys(instance.tags).length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(instance.tags).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-[10px] font-mono">
                                    {key}: {value}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <DeleteConfirmModal
                open={deleteModal}
                onClose={() => setDeleteModal(false)}
                instanceName={instance?.name || instance_id || ''}
                onConfirm={async () => {
                    setDeleteModal(false);
                    await vmAction('delete');
                }}
                loading={actionLoading}
            />
        </div>
    );
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
                        <AlertDialogTitle>Delete EC2 Instance</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p>This will <strong>permanently terminate</strong> the instance and clean up attached volumes, snapshots, and Elastic IPs.</p>
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

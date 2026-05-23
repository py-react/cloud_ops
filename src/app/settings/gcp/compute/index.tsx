import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Cpu,
    Plus,
    RefreshCw,
    HardDrive,
    Server,
    Play,
    Square,
    Trash2,
} from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import { GCPErrorBanner, GCPError } from '@/components/GCPErrorBanner';
import PageLayout from '@/components/PageLayout';
import { GCPCredentialSelector } from '@/components/gcp/GCPCredentialSelector';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { CreateVMWizard, CreateVMValues } from '@/components/gcp/compute/CreateVMWizard';
import { ResourceDetailPanel } from '@/components/gcp/ResourceDetailPanel';
import useNavigate from '@/libs/navigate';

import { Copy, Check } from 'lucide-react';

const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click navigation
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

interface VMInstance {
    name: string;
    status: string;
    zone: string;
    machine_type: string;
    internal_ip: string;
    external_ip: string;
    creation_timestamp: string;
    ssh_username: string;
}

interface Disk {
    name: string;
    status: string;
    zone: string;
    size_gb: number;
    type: string;
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
        header: "Status",
        accessor: "status",
        cell: (row: any) => {
            switch (row.status) {
                case 'RUNNING': return <Badge variant="success" className="text-[10px] font-black uppercase">RUNNING</Badge>;
                case 'PROVISIONING': return <Badge variant="warning" className="text-[10px] font-black uppercase animate-pulse">PROVISIONING</Badge>;
                case 'TERMINATED': return <Badge variant="outline" className="text-[10px] font-black uppercase">TERMINATED</Badge>;
                case 'STOPPING': return <Badge variant="warning" className="text-[10px] font-black uppercase animate-pulse">STOPPING</Badge>;
                case 'DELETING': return <Badge variant="warning" className="text-[10px] font-black uppercase animate-pulse">DELETING</Badge>;
                case 'FAILED': return <Badge variant="destructive" className="text-[10px] font-black uppercase">FAILED</Badge>;
                default: return <Badge variant="outline" className="text-[10px] font-black uppercase">{row.status}</Badge>;
            }
        }
    },
    { header: "Zone", accessor: "zone" },
    {
        header: "SSH Username",
        accessor: "ssh_username",
        cell: (row: any) => (
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground font-semibold">{row.ssh_username || 'admin'}</span>
                {row.ssh_username && (
                    <CopyButton value={row.ssh_username} />
                )}
            </div>
        )
    },
    {
        header: "External IP",
        accessor: "external_ip",
        cell: (row: any) => (
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground font-semibold">{row.external_ip || '—'}</span>
                {row.external_ip && row.external_ip !== 'N/A' && row.external_ip !== '—' && (
                    <CopyButton value={row.external_ip} />
                )}
            </div>
        )
    },
];

const diskColumns = [
    {
        header: "Disk Name",
        accessor: "name",
        cell: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 border">
                    <HardDrive className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-foreground">{row.name}</span>
            </div>
        )
    },
    {
        header: "Type",
        accessor: "type",
        cell: (row: any) => <Badge variant="outline" className="text-[10px] font-bold uppercase">{row.type}</Badge>
    },
    { header: "Zone", accessor: "zone" },
    {
        header: "Size",
        accessor: "size_gb",
        cell: (row: any) => <span className="font-bold text-xs">{row.size_gb} GB</span>
    },
    {
        header: "Status",
        accessor: "status",
        cell: (row: any) => <Badge variant={row.status === 'READY' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">{row.status}</Badge>
    },
];

const NO_EXTRAS = { showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false };

export default function ComputeOrchestrator() {
    const { selectedGcpCredential } = useGCP();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('instances');
    const [instances, setInstances] = useState<VMInstance[]>([]);
    const [disks, setDisks] = useState<Disk[]>([]);
    const [fetchingResources, setFetchingResources] = useState(false);
    const [instanceError, setInstanceError] = useState<GCPError | null>(null);
    const [diskError, setDiskError] = useState<GCPError | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Detail panel state
    const [selectedInstance, setSelectedInstance] = useState<VMInstance | null>(null);
    const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchInstances = useCallback(async (projectId: string, credId: number) => {
        const token = getAuthToken();
        try {
            const url = `/api/v1/gcp/compute/instances?project_id=${projectId}&credential_id=${credId}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                setInstanceError(data);
            } else {
                setInstances(data.instances || []);
                setInstanceError(null);
            }
        } catch {
            toast.error('Failed to sync VM instances');
        }
    }, []);

    const fetchDisks = useCallback(async (projectId: string, credId: number) => {
        const token = getAuthToken();
        try {
            const url = `/api/v1/gcp/compute/disks?project_id=${projectId}&credential_id=${credId}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                setDiskError(data);
            } else {
                setDisks(data.disks || []);
                setDiskError(null);
            }
        } catch {
            toast.error('Failed to sync disks');
        }
    }, []);

    const fetchResources = useCallback(async (projectId: string, credId: number) => {
        if (!projectId || !credId) return;
        setFetchingResources(true);
        await Promise.allSettled([fetchInstances(projectId, credId), fetchDisks(projectId, credId)]);
        setFetchingResources(false);
        setHasLoaded(true);
    }, [fetchInstances, fetchDisks]);

    useEffect(() => {
        const projectId = selectedGcpCredential?.project_id;
        const credId = selectedGcpCredential?.id;
        if (projectId && credId) {
            setHasLoaded(false);
            fetchResources(projectId, credId);
        } else {
            setInstances([]); setDisks([]);
            setInstanceError(null); setDiskError(null);
            setHasLoaded(false);
        }
    }, [selectedGcpCredential?.project_id, selectedGcpCredential?.id, fetchResources]);

    const vmAction = async (instance: VMInstance, action: 'start' | 'stop' | 'delete') => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setActionLoading(true);

        setInstances(prev => prev.map(i =>
            i.name === instance.name
                ? { ...i, status: action === 'delete' ? 'STOPPING' : action === 'start' ? 'PROVISIONING' : 'STOPPING' }
                : i
        ));

        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        try {
            const url = action === 'delete'
                ? `/api/v1/gcp/compute/instances/${instance.name}?project_id=${projectId}&zone=${instance.zone}&credential_id=${credId}`
                : `/api/v1/gcp/compute/instances/${instance.name}/${action}?project_id=${projectId}&zone=${instance.zone}&credential_id=${credId}`;
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') {
                fetchInstances(projectId, credId);
                toast.error(data.message);
            } else {
                toast.success(`VM ${action} queued`);
                if (action === 'delete') setSelectedInstance(null);
                fetchInstances(projectId, credId);
            }
        } catch {
            fetchInstances(projectId, credId);
            toast.error(`Failed to ${action} VM`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteDisk = async (disk: Disk) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setActionLoading(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/compute/disks/${disk.name}?project_id=${projectId}&zone=${disk.zone}&credential_id=${credId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                toast.error(data.message);
            } else {
                toast.success(`Disk "${disk.name}" deletion initiated`);
                setSelectedDisk(null);
                fetchDisks(projectId, credId);
            }
        } catch {
            toast.error('Failed to delete disk');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateVM = async (values: CreateVMValues) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;

        console.log('FRONTEND PAYLOAD AUDIT - Values from form:', JSON.stringify(values, null, 2));

        const tempInstance: VMInstance = {
            name: `${values.instance_name}-...`,
            status: 'PROVISIONING',
            zone: values.zone,
            machine_type: values.machine_type,
            internal_ip: 'N/A',
            external_ip: 'N/A',
            creation_timestamp: new Date().toISOString(),
            ssh_username: 'admin',
        };
        setInstances(prev => [tempInstance, ...prev]);

        try {
            const res = await fetch(`/api/v1/gcp/compute/instances?credential_id=${credId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    project_id: projectId,
                    instance_name: values.instance_name,
                    zone: values.zone,
                    machine_type: values.machine_type,
                    boot_disk_size_gb: values.boot_disk_size_gb || 10,
                    boot_disk_type: values.boot_disk_type || 'pd-balanced',
                    os_image: values.os_image || 'projects/debian-cloud/global/images/family/debian-12',
                    selected_os_key: values.selected_os_key || 'debian-12',
                    ssh_username: values.ssh_username || undefined,
                    ssh_key: values.ssh_key || undefined,
                })
            });
            const data = await res.json();
            if (data.status === 'error') {
                setInstances(prev => prev.filter(i => i.name !== tempInstance.name));
                toast.error(data.message);
            } else {
                toast.success('VM Provisioning queued!');
                setShowCreateDialog(false);
                fetchInstances(projectId, credId);
            }
        } catch {
            setInstances(prev => prev.filter(i => i.name !== tempInstance.name));
            toast.error('Failed to create VM');
        }
    };

    return (
        <PageLayout
            title="Compute Engine"
            subtitle="Manage and provision virtual machines and persistent disks."
            icon={Cpu}
            actions={
                <div className="flex items-center gap-2">
                    <GCPCredentialSelector />
                    <Button
                        variant="outline" size="sm"
                        onClick={() => { if (selectedGcpCredential?.project_id && selectedGcpCredential?.id) fetchResources(selectedGcpCredential.project_id, selectedGcpCredential.id); }}
                        disabled={fetchingResources}
                        className="h-9 font-bold uppercase tracking-tight text-[10px]"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${fetchingResources ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button size="sm" onClick={() => setShowCreateDialog(true)} className="font-black text-[10px] uppercase tracking-widest px-6 h-9">
                        <Plus className="w-3.5 h-3.5 mr-2" /> New Instance
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
                        <Tabs
                            activeTab={activeTab}
                            onChange={setActiveTab}
                            tabs={[
                                { id: 'instances', label: 'VM Instances', icon: <Server className="w-3.5 h-3.5" /> },
                                { id: 'disks', label: 'Persistent Disks', icon: <HardDrive className="w-3.5 h-3.5" /> }
                            ]}
                        />

                        {activeTab === 'instances' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {instanceError ? (
                                    <GCPErrorBanner error={instanceError} onRetry={() => fetchInstances(selectedGcpCredential?.project_id!, selectedGcpCredential?.id!)} />
                                ) : (
                                    <>
                                        <ResourceTable
                                            title="Compute Instances"
                                            description={`${instances.length} VMs in ${selectedGcpCredential?.project_id}`}
                                            icon={<Cpu className="w-5 h-5 text-primary" />}
                                            columns={instanceColumns}
                                            data={instances.map(i => ({ ...i, ...NO_EXTRAS, showViewDetails: true, showDelete: true }))}
                                            loading={fetchingResources}
                                            onViewDetails={(i) => navigate(`/settings/gcp/compute/instances/${(i as VMInstance).name}?zone=${(i as VMInstance).zone}`)}
                                            onDelete={(i) => vmAction(i as unknown as VMInstance, 'delete')}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'disks' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {diskError ? (
                                    <GCPErrorBanner error={diskError} onRetry={() => fetchDisks(selectedGcpCredential?.project_id!, selectedGcpCredential?.id!)} />
                                ) : (
                                    <>
                                        <ResourceTable
                                            title="Persistent Disks"
                                            description={`${disks.length} disks in ${selectedGcpCredential?.project_id}`}
                                            icon={<HardDrive className="w-5 h-5 text-slate-700" />}
                                            columns={diskColumns}
                                            data={disks.map(d => ({ ...d, ...NO_EXTRAS, showViewDetails: true, showDelete: true }))}
                                            loading={fetchingResources}
                                            onViewDetails={(d) => setSelectedDisk(d as unknown as Disk)}
                                            onDelete={(d) => handleDeleteDisk(d as unknown as Disk)}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateVMWizard
                projectId={selectedGcpCredential?.project_id || ""}
                isWizardOpen={showCreateDialog}
                setIsWizardOpen={setShowCreateDialog}
                onSubmit={handleCreateVM}
            />

            {/* VM Instance Detail Panel */}
            <ResourceDetailPanel
                open={!!selectedInstance}
                onClose={() => setSelectedInstance(null)}
                title={selectedInstance?.name || ''}
                subtitle="VM Instance"
                icon={Cpu}
                fields={[
                    { label: 'Instance Name', value: selectedInstance?.name, mono: true },
                    { label: 'Project', value: selectedGcpCredential?.project_id, mono: true },
                    { label: 'Zone', value: selectedInstance?.zone },
                    { label: 'Machine Type', value: selectedInstance?.machine_type },
                    { label: 'Internal IP', value: selectedInstance?.internal_ip || '—', mono: true },
                    { label: 'External IP', value: selectedInstance?.external_ip || 'None', mono: true },
                    {
                        label: 'Status', value: selectedInstance ? (
                            <Badge variant={selectedInstance.status === 'RUNNING' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">
                                {selectedInstance.status}
                            </Badge>
                        ) : '—'
                    },
                ]}
                actions={[
                    {
                        label: 'Start',
                        icon: Play,
                        variant: 'default',
                        loading: actionLoading,
                        disabled: selectedInstance?.status === 'RUNNING' || selectedInstance?.status === 'STOPPING' || selectedInstance?.status === 'PROVISIONING',
                        onClick: () => selectedInstance && vmAction(selectedInstance, 'start'),
                    },
                    {
                        label: 'Stop',
                        icon: Square,
                        variant: 'outline',
                        loading: actionLoading,
                        disabled: selectedInstance?.status === 'TERMINATED' || selectedInstance?.status === 'STOPPING' || selectedInstance?.status === 'PROVISIONING',
                        onClick: () => selectedInstance && vmAction(selectedInstance, 'stop'),
                    },
                    {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'destructive',
                        loading: actionLoading,
                        disabled: selectedInstance?.status === 'STOPPING' || selectedInstance?.status === 'PROVISIONING',
                        onClick: () => selectedInstance && vmAction(selectedInstance, 'delete'),
                    },
                ]}
            />

            {/* Disk Detail Panel */}
            <ResourceDetailPanel
                open={!!selectedDisk}
                onClose={() => setSelectedDisk(null)}
                title={selectedDisk?.name || ''}
                subtitle="Persistent Disk"
                icon={HardDrive}
                fields={[
                    { label: 'Disk Name', value: selectedDisk?.name, mono: true },
                    { label: 'Project', value: selectedGcpCredential?.project_id, mono: true },
                    { label: 'Zone', value: selectedDisk?.zone },
                    { label: 'Type', value: selectedDisk?.type },
                    { label: 'Size', value: selectedDisk ? `${selectedDisk.size_gb} GB` : '—' },
                    {
                        label: 'Status', value: selectedDisk ? (
                            <Badge variant={selectedDisk.status === 'READY' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">
                                {selectedDisk.status}
                            </Badge>
                        ) : '—'
                    },
                ]}
                actions={[
                    {
                        label: 'Delete Disk',
                        icon: Trash2,
                        variant: 'destructive',
                        loading: actionLoading,
                        onClick: () => selectedDisk && handleDeleteDisk(selectedDisk),
                    }
                ]}
            />
        </PageLayout>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Plus, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import PageLayout from '@/components/PageLayout';
import { GCPCredentialSelector } from '@/components/gcp/GCPCredentialSelector';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { CreateStorageWizard, CreateStorageValues } from '@/components/gcp/storage/CreateStorageWizard';
import { GCPErrorBanner } from '@/components/GCPErrorBanner';
import useNavigate from '@/libs/navigate';

interface FilestoreInstance { name: string; tier: string; state: string; location: string; capacity_gb: number; file_shares: { name: string; capacity_gb: number }[]; }

const columns = [
    { header: "Instance Name", accessor: "name", cell: (row: any) => (<div className="flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-purple-50 flex items-center justify-center text-purple-600 border"><FolderOpen className="w-4 h-4" /></div><span className="font-bold text-sm text-foreground">{row.name.split('/').pop()}</span></div>) },
    { header: "Tier", accessor: "tier", cell: (row: any) => <Badge variant="outline" className="text-[10px] font-bold uppercase">{row.tier}</Badge> },
    { header: "Location", accessor: "location" },
    { header: "Capacity", accessor: "capacity_gb", cell: (row: any) => <span className="font-bold text-xs">{row.capacity_gb} GB</span> },
    { header: "Status", accessor: "state", cell: (row: any) => <Badge variant={row.state === 'READY' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">{row.state}</Badge> },
];

export default function FilestoresList() {
    const { selectedGcpCredential } = useGCP();
    const [filestores, setFilestores] = useState<FilestoreInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<any | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const navigate = useNavigate();

    const fetchFilestores = useCallback(async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setLoading(true);
        setApiError(null);
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/filestore?project_id=${projectId}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') {
                setApiError(data);
            } else {
                setFilestores(data.instances || []);
            }
        } catch { toast.error('Failed to sync filestores'); }
        finally { setLoading(false); }
    }, [selectedGcpCredential?.project_id, selectedGcpCredential?.id]);

    useEffect(() => { fetchFilestores(); }, [fetchFilestores]);

    const handleDelete = async (instance: FilestoreInstance) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const loc = instance.location;
        const instanceId = instance.name.split('/').pop();
        try {
            const res = await fetch(`/api/v1/gcp/filestore/${instanceId}?project_id=${projectId}&location=${loc}&credential_id=${credId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Filestore "${instanceId}" deleted`); fetchFilestores(); }
        } catch { toast.error('Failed to delete filestore'); }
    };

    const handleCreate = async (values: CreateStorageValues) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/filestore?credential_id=${credId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ project_id: projectId, instance_id: values.name, share_name: values.file_share_name, capacity_gb: values.size_gb, location: values.zone, tier: values.filestore_tier || 'STANDARD' })
            });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success('Filestore created'); setShowCreateDialog(false); fetchFilestores(); }
        } catch { toast.error('Failed to create filestore'); }
    };

    return (
        <PageLayout title="File Storage" subtitle="Managed NFS file shares for multi-instance mounting" icon={Layers} actions={
            <div className="flex items-center gap-2">
                <GCPCredentialSelector />
                <Button variant="outline" size="sm" onClick={fetchFilestores} disabled={loading} className="h-9 font-bold uppercase tracking-tight text-[10px]"><RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync</Button>
                <Button size="sm" onClick={() => setShowCreateDialog(true)} className="font-black text-[10px] uppercase tracking-widest px-6 h-9"><Plus className="w-3.5 h-3.5 mr-2" /> Create Filestore</Button>
            </div>
        }>
            <div className="pt-4 space-y-6">
                {apiError ? <GCPErrorBanner error={apiError} onRetry={fetchFilestores} /> : (
                    <ResourceTable title="Filestore Instances" description="NFS file shares for shared filesystems" icon={<FolderOpen className="w-5 h-5 text-purple-600" />} columns={columns} data={filestores.map(f => ({ ...f, showViewDetails: true, showDelete: true, showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false }))} loading={loading} onViewDetails={(f) => navigate(`/settings/gcp/storage/filestores/${(f as FilestoreInstance).name.split('/').pop()}`)} onDelete={(f) => handleDelete(f as FilestoreInstance)} />
                )}
            </div>
            <CreateStorageWizard projectId={selectedGcpCredential?.project_id || ""} isWizardOpen={showCreateDialog} setIsWizardOpen={setShowCreateDialog} onSubmit={handleCreate} defaultType="filestore" />
        </PageLayout>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Plus, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import PageLayout from '@/components/PageLayout';
import { GCPCredentialSelector } from '@/components/gcp/GCPCredentialSelector';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { CreateStorageWizard, CreateStorageValues } from '@/components/gcp/storage/CreateStorageWizard';
import useNavigate from '@/libs/navigate';

interface Disk { name: string; status: string; zone: string; size_gb: number; type: string; }

const columns = [
    { header: "Disk Name", accessor: "name", cell: (row: any) => (<div className="flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 border"><HardDrive className="w-4 h-4" /></div><span className="font-bold text-sm text-foreground">{row.name}</span></div>) },
    { header: "Type", accessor: "type", cell: (row: any) => <Badge variant="outline" className="text-[10px] font-bold uppercase">{row.type}</Badge> },
    { header: "Zone", accessor: "zone" },
    { header: "Size", accessor: "size_gb", cell: (row: any) => <span className="font-bold text-xs">{row.size_gb} GB</span> },
    { header: "Status", accessor: "status", cell: (row: any) => <Badge variant={row.status === 'READY' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">{row.status}</Badge> },
];

export default function DisksList() {
    const { selectedGcpCredential } = useGCP();
    const [disks, setDisks] = useState<Disk[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const navigate = useNavigate();

    const fetchDisks = useCallback(async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setLoading(true);
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/compute/disks?project_id=${projectId}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status !== 'error') setDisks(data.disks || []);
        } catch { toast.error('Failed to sync disks'); }
        finally { setLoading(false); }
    }, [selectedGcpCredential?.project_id, selectedGcpCredential?.id]);

    useEffect(() => { fetchDisks(); }, [fetchDisks]);

    const handleDelete = async (disk: Disk) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/compute/disks/${disk.name}?project_id=${projectId}&zone=${disk.zone}&credential_id=${credId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Disk "${disk.name}" deleted`); fetchDisks(); }
        } catch { toast.error('Failed to delete disk'); }
    };

    const handleCreate = async (values: CreateStorageValues) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const token = getAuthToken(); const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const res = await fetch(`/api/v1/gcp/compute/disks?credential_id=${credId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ project_id: projectId, disk_name: values.name, zone: values.zone, size_gb: values.size_gb, disk_type: values.disk_type })
            });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success('Disk created'); setShowCreateDialog(false); fetchDisks(); }
        } catch { toast.error('Failed to create disk'); }
    };

    return (
        <PageLayout title="Block Storage" subtitle="Compute Engine block storage volumes" icon={Layers} actions={
            <div className="flex items-center gap-2">
                <GCPCredentialSelector />
                <Button variant="outline" size="sm" onClick={fetchDisks} disabled={loading} className="h-9 font-bold uppercase tracking-tight text-[10px]"><RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync</Button>
                <Button size="sm" onClick={() => setShowCreateDialog(true)} className="font-black text-[10px] uppercase tracking-widest px-6 h-9"><Plus className="w-3.5 h-3.5 mr-2" /> Create Disk</Button>
            </div>
        }>
            <div className="pt-4 space-y-6">
                <ResourceTable title="Persistent Disks" description="Block storage volumes for VM instances" icon={<HardDrive className="w-5 h-5 text-slate-700" />} columns={columns} data={disks.map(d => ({ ...d, showViewDetails: true, showDelete: true, showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false }))} loading={loading} onViewDetails={(d) => navigate(`/settings/gcp/storage/disks/${(d as Disk).name}`)} onDelete={(d) => handleDelete(d as Disk)} />
            </div>
            <CreateStorageWizard projectId={selectedGcpCredential?.project_id || ""} isWizardOpen={showCreateDialog} setIsWizardOpen={setShowCreateDialog} onSubmit={handleCreate} defaultType="disk" />
        </PageLayout>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, Plus, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultService } from '@/gingerJs_api_client';
import PageLayout from '@/components/PageLayout';
import { GCPCredentialSelector } from '@/components/gcp/GCPCredentialSelector';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { CreateStorageWizard, CreateStorageValues } from '@/components/gcp/storage/CreateStorageWizard';
import useNavigate from '@/libs/navigate';

interface Bucket { name: string; location: string; created_at: string; storage_class: string; }

const columns = [
    { header: "Bucket Name", accessor: "name", cell: (row: any) => (<div className="flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 border"><Box className="w-4 h-4" /></div><span className="font-bold text-sm text-foreground">{row.name}</span></div>) },
    { header: "Location", accessor: "location" },
    { header: "Storage Class", accessor: "storage_class" },
    { header: "Created", accessor: "created_at", cell: (row: any) => (<span className="text-xs font-mono text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>) },
    { header: "Status", accessor: "status", cell: () => <Badge variant="success" className="text-[10px] font-black uppercase">ACTIVE</Badge> },
];

export default function BucketsList() {
    const { selectedGcpCredential } = useGCP();
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const navigate = useNavigate();

    const fetchBuckets = useCallback(async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setLoading(true);
        try {
            const data: any = await DefaultService.apiV1StorageBucketsGet({
                credentialId: String(selectedGcpCredential.id),
                projectId: selectedGcpCredential.project_id,
            });
            if (data.status !== 'error') setBuckets(data.buckets || []);
        } catch { toast.error('Failed to sync buckets'); }
        finally { setLoading(false); }
    }, [selectedGcpCredential?.project_id, selectedGcpCredential?.id]);

    useEffect(() => { fetchBuckets(); }, [fetchBuckets]);

    const handleDelete = async (bucket: Bucket) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        try {
            const data: any = await DefaultService.apiV1StorageBucketsBucketNameDelete({
                bucketName: bucket.name,
                credentialId: String(selectedGcpCredential.id),
                projectId: selectedGcpCredential.project_id,
            });
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Bucket "${bucket.name}" deleted`); fetchBuckets(); }
        } catch { toast.error('Failed to delete bucket'); }
    };

    const handleCreate = async (values: CreateStorageValues) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        try {
            const data: any = await DefaultService.apiV1StorageBucketsPost({
                credentialId: String(selectedGcpCredential.id),
                requestBody: {
                    project_id: selectedGcpCredential.project_id,
                    bucket_name: values.name,
                    location: values.location,
                    storage_class: values.storage_class,
                    autoclass_enabled: values.autoclass_enabled,
                    hierarchical_namespace_enabled: values.hierarchical_namespace_enabled,
                    rapid_cache_enabled: values.rapid_cache_enabled,
                    soft_delete_days: values.soft_delete_days,
                    versioning_enabled: values.versioning_enabled,
                    encryption_kms_key: values.encryption_kms_key,
                },
            });
            if (data.status === 'error') toast.error(data.message);
            else { toast.success('Bucket created'); setShowCreateDialog(false); fetchBuckets(); }
        } catch { toast.error('Failed to create bucket'); }
    };

    return (
        <PageLayout title="Object Storage" subtitle="Globally unique object containers" icon={Layers} actions={
            <div className="flex items-center gap-2">
                <GCPCredentialSelector />
                <Button variant="outline" size="sm" onClick={fetchBuckets} disabled={loading} className="h-9 font-bold uppercase tracking-tight text-[10px]"><RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync</Button>
                <Button size="sm" onClick={() => setShowCreateDialog(true)} className="font-black text-[10px] uppercase tracking-widest px-6 h-9"><Plus className="w-3.5 h-3.5 mr-2" /> Create Bucket</Button>
            </div>
        }>
            <div className="pt-4 space-y-6">
                <ResourceTable title="Storage Buckets" description="GCS buckets for unstructured data" icon={<Box className="w-5 h-5 text-primary" />} columns={columns} data={buckets.map(b => ({ ...b, showViewDetails: true, showDelete: true, showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false }))} loading={loading} onViewDetails={(b) => navigate(`/settings/gcp/storage/buckets/${(b as Bucket).name}`)} onDelete={(b) => handleDelete(b as Bucket)} />
            </div>
            <CreateStorageWizard projectId={selectedGcpCredential?.project_id || ""} isWizardOpen={showCreateDialog} setIsWizardOpen={setShowCreateDialog} onSubmit={handleCreate} defaultType="bucket" />
        </PageLayout>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, Plus, RefreshCw, Layers, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultService } from "@/gingerJs_api_client";
import PageLayout from '@/components/PageLayout';
import { AWSCredentialSelector } from '@/components/aws/AWSCredentialSelector';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import useNavigate from '@/libs/navigate';
import { CreateS3BucketWizard, type CreateS3BucketValues } from '@/components/aws/storage/CreateS3BucketWizard';

interface Bucket {
    name: string;
    creation_date: string;
}

const columns = [
    {
        header: "Bucket Name", accessor: "name",
        cell: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 border">
                    <Box className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-foreground">{row.name}</span>
            </div>
        )
    },
    {
        header: "Created", accessor: "creation_date",
        cell: (row: any) => (
            <span className="text-xs font-mono text-muted-foreground">
                {row.creation_date ? new Date(row.creation_date).toLocaleDateString() : '—'}
            </span>
        )
    },
    {
        header: "Status", accessor: "status",
        cell: () => <Badge variant="success" className="text-[10px] font-black uppercase">ACTIVE</Badge>
    },
];

export default function BucketsList() {
    const { selectedAwsCredential } = useAWS();
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [editingBucket, setEditingBucket] = useState<string | null>(null);
    const [editingInitialValues, setEditingInitialValues] = useState<Partial<CreateS3BucketValues> | undefined>(undefined);
    const navigate = useNavigate();

    const fetchBuckets = useCallback(async () => {
        if (!selectedAwsCredential?.id) return;
        setLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsGet({ credentialId: credId });
            if (data.status !== 'error') setBuckets(data.buckets || []);
        } catch (e) { toast.error('Failed to sync buckets: ' + (e instanceof Error ? e.message : String(e))); }
        finally { setLoading(false); }
    }, [selectedAwsCredential?.id]);

    useEffect(() => { fetchBuckets(); }, [fetchBuckets]);

    const handleDelete = async (bucket: Bucket) => {
        if (!selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsBucketNameDelete({ bucketName: bucket.name, credentialId: credId });
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Bucket "${bucket.name}" deleted`); fetchBuckets(); }
        } catch { toast.error('Failed to delete bucket'); }
    };

    const handleEdit = async (bucket: Bucket) => {
        if (!selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsBucketNameConfigGet({ bucketName: bucket.name, credentialId: credId });
            if (data.status === 'error') { toast.error(data.message); return; }

            const tagArray: { key: string; value: string }[] = [];
            if (data.tags) {
                for (const [k, v] of Object.entries(data.tags)) {
                    tagArray.push({ key: k, value: v as string });
                }
            }
            if (!tagArray.length) tagArray.push({ key: '', value: '' });

            setEditingInitialValues({
                bucket_name: data.name || bucket.name,
                region: data.region || 'us-east-1',
                storage_class: data.storage_class || 'STANDARD',
                versioning_enabled: data.versioning_enabled ?? false,
                versioning_expire_days: data.versioning_expire_days ?? 0,
                object_lock_enabled: data.object_lock_enabled ?? false,
                object_lock_mode: data.object_lock_mode || 'GOVERNANCE',
                object_lock_days: data.object_lock_days ?? 30,
                encryption: data.encryption || 'AES256',
                kms_key_id: data.kms_key_id || '',
                bucket_policy: data.bucket_policy || '',
                tags: tagArray,
            });
            setEditingBucket(bucket.name);
            setShowWizard(true);
        } catch { toast.error('Failed to fetch bucket config'); }
    };

    const handleWizardSubmit = async (values: CreateS3BucketValues) => {
        if (!selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        const tagObj: Record<string, string> = {};
        (values.tags || []).filter(t => t.key.trim()).forEach(t => { tagObj[t.key.trim()] = t.value.trim(); });

        if (editingBucket) {
            try {
                const res = await fetch(`/api/v1/aws/storage/buckets/${editingBucket}/config?credential_id=${credId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        versioning_enabled: values.versioning_enabled,
                        versioning_expire_days: values.versioning_enabled ? values.versioning_expire_days : 0,
                        encryption: values.encryption,
                        kms_key_id: values.encryption === 'aws:kms' ? values.kms_key_id : '',
                        bucket_policy: values.bucket_policy || '',
                        tags: Object.keys(tagObj).length ? tagObj : {},
                    })
                });
                const data = await res.json();
                if (data.status === 'error') toast.error(data.message);
                else { toast.success('Bucket updated'); setShowWizard(false); fetchBuckets(); }
            } catch { toast.error('Failed to update bucket'); }
        } else {
            try {
                const data: any = await DefaultService.apiV1AwsStorageBucketsPost({
                    credentialId: credId,
                    requestBody: {
                        bucket_name: values.bucket_name.trim(),
                        region: values.region,
                        storage_class: values.storage_class,
                        versioning_enabled: values.versioning_enabled,
                        versioning_expire_days: values.versioning_enabled ? values.versioning_expire_days : 0,
                        object_lock_enabled: values.object_lock_enabled,
                        object_lock_mode: values.object_lock_enabled ? values.object_lock_mode : '',
                        object_lock_days: values.object_lock_enabled ? values.object_lock_days : 0,
                        encryption: values.encryption,
                        kms_key_id: values.encryption === 'aws:kms' ? values.kms_key_id : '',
                        bucket_policy: values.bucket_policy || '',
                        tags: Object.keys(tagObj).length ? tagObj : {},
                    }
                });
                if (data.status === 'error') toast.error(data.message);
                else {
                    toast.success('Bucket created successfully');
                    setShowWizard(false);
                    fetchBuckets();
                }
            } catch { toast.error('Failed to create bucket'); }
        }
    };

    const handleCloseWizard = () => {
        setShowWizard(false);
        setEditingBucket(null);
        setEditingInitialValues(undefined);
    };

    return (
        <PageLayout
            title="Cloud Storage"
            subtitle="S3 object storage buckets"
            icon={Layers}
            actions={
                <div className="flex items-center gap-2">
                    <AWSCredentialSelector />
                    <Button variant="outline" size="sm" onClick={fetchBuckets} disabled={loading}
                        className="h-9 font-bold uppercase tracking-tight text-[10px]">
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button size="sm" onClick={() => { setEditingBucket(null); setEditingInitialValues(undefined); setShowWizard(true); }}
                        className="font-black text-[10px] uppercase tracking-widest px-6 h-9">
                        <Plus className="w-3.5 h-3.5 mr-2" /> Create Bucket
                    </Button>
                </div>
            }
        >
            <div className="pt-4 space-y-6">
                <ResourceTable
                    title="S3 Buckets"
                    description="AWS S3 buckets for unstructured data"
                    icon={<Box className="w-5 h-5 text-primary" />}
                    columns={columns}
                    data={buckets.map(b => ({
                        ...b,
                        showViewDetails: true,
                        showDelete: true,
                        showPlay: false, showStop: false, showPause: false,
                        showClone: false, showUndo: false, showViewLogs: false,
                        showViewConfig: false, showEdit: true, showPush: false
                    }))}
                    loading={loading}
                    onViewDetails={(b) => navigate(`/settings/aws/storage/buckets/${(b as Bucket).name}`)}
                    onDelete={(b) => handleDelete(b as Bucket)}
                    onEdit={(b) => handleEdit(b as Bucket)}
                />
            </div>

            <CreateS3BucketWizard
                isWizardOpen={showWizard}
                setIsWizardOpen={handleCloseWizard}
                onSubmit={handleWizardSubmit}
                editingBucket={editingBucket ?? undefined}
                initialValuesOverride={editingInitialValues}
            />
        </PageLayout>
    );
}

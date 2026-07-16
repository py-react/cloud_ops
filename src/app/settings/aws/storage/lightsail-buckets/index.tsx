import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultService } from "@/gingerJs_api_client";
import PageLayout from '@/components/PageLayout';
import { AWSCredentialSelector } from '@/components/aws/AWSCredentialSelector';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import useNavigate from '@/libs/navigate';

interface LightsailBucket {
    name: string;
    region: string;
    url: string;
    created_at: string | null;
    capacity_gb: number;
    object_count: number;
    size_gb: number;
    state: string | null;
    bundle_id: string;
}

function formatBytes(gb: number): string {
    if (!gb) return '0 GB';
    return `${gb.toFixed(2)} GB`;
}

const columns = [
    {
        header: "Bucket Name", accessor: "name",
        cell: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 border">
                    <Database className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-foreground">{row.name}</span>
            </div>
        ),
    },
    {
        header: "Region", accessor: "region",
        cell: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.region}</span>,
    },
    {
        header: "Capacity", accessor: "capacity_gb",
        cell: (row: any) => <span className="text-xs font-mono">{formatBytes(row.capacity_gb)}</span>,
    },
    {
        header: "Objects", accessor: "object_count",
        cell: (row: any) => <span className="text-xs font-mono">{row.object_count?.toLocaleString() || 0}</span>,
    },
    {
        header: "Size Used", accessor: "size_gb",
        cell: (row: any) => <span className="text-xs font-mono">{formatBytes(row.size_gb)}</span>,
    },
    {
        header: "Status", accessor: "state",
        cell: () => <Badge variant="success" className="text-[10px] font-black uppercase">ACTIVE</Badge>,
    },
];

export default function LightsailBucketsList() {
    const { selectedAwsCredential } = useAWS();
    const [buckets, setBuckets] = useState<LightsailBucket[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchBuckets = useCallback(async () => {
        if (!selectedAwsCredential?.id) return;
        setLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageLightsailBucketsGet({ credentialId: credId });
            if (data.status !== 'error') setBuckets(data.buckets || []);
        } catch { toast.error('Failed to sync Lightsail buckets'); }
        finally { setLoading(false); }
    }, [selectedAwsCredential?.id]);

    useEffect(() => { fetchBuckets(); }, [fetchBuckets]);

    const handleDelete = async (bucket: LightsailBucket) => {
        if (!selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageLightsailBucketsBucketNameDelete({ bucketName: bucket.name, credentialId: credId });
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Bucket "${bucket.name}" deleted`); fetchBuckets(); }
        } catch { toast.error('Failed to delete bucket'); }
    };

    return (
        <PageLayout
            title="Lightsail Buckets"
            subtitle="Simplified object storage via Amazon Lightsail"
            icon={Database}
            actions={
                <div className="flex items-center gap-2">
                    <AWSCredentialSelector />
                    <Button variant="outline" size="sm" onClick={fetchBuckets} disabled={loading}
                        className="h-9 font-bold uppercase tracking-tight text-[10px]">
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                </div>
            }
        >
            <div className="pt-4 space-y-6">
                <ResourceTable
                    title="Lightsail Buckets"
                    description="Amazon Lightsail object storage buckets"
                    icon={<Database className="w-5 h-5 text-emerald-600" />}
                    columns={columns}
                    data={buckets.map(b => ({
                        ...b,
                        showViewDetails: true,
                        showDelete: true,
                        showPlay: false, showStop: false, showPause: false,
                        showClone: false, showUndo: false, showViewLogs: false,
                        showViewConfig: false, showEdit: false, showPush: false,
                    }))}
                    loading={loading}
                    onViewDetails={(b) => navigate(`/settings/aws/storage/lightsail-buckets/${(b as LightsailBucket).name}`)}
                    onDelete={(b) => handleDelete(b as LightsailBucket)}
                />
            </div>
        </PageLayout>
    );
}

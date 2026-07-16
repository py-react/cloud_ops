import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DefaultService } from '@/gingerJs_api_client/services/DefaultService';
import PageLayout from '@/components/PageLayout';
import useNavigate from '@/libs/navigate';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';

// GCP Context / Wizards
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { CreateStorageWizard, CreateStorageValues } from '@/components/gcp/storage/CreateStorageWizard';

// AWS Context / Wizards
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { CreateS3BucketWizard, type CreateS3BucketValues } from '@/components/aws/storage/CreateS3BucketWizard';

// Unified Quick Create Wizard
import { QuickCreateWizard } from '@/components/cloud/QuickCreateWizard';

import {
    Cpu,
    Plus,
    RefreshCw,
    HardDrive,
    Server,
    Box,
    Database,
    Cloud,
    Trash2,
    Loader2,
    AlertTriangle,
    ChevronDown,
    Check,
    Globe,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface UnifiedCompute {
    id: string;
    name: string;
    provider: 'GCP' | 'AWS';
    status: string;
    type: string;
    location: string;
    public_ip: string;
    raw: any;
}

interface UnifiedBucket {
    name: string;
    provider: 'GCP' | 'AWS';
    location: string;
    storage_class: string;
    created_at: string;
    raw: any;
}

interface UnifiedDisk {
    name: string;
    provider: 'GCP';
    type: string;
    zone: string;
    size_gb: number;
    status: string;
    raw: any;
}

export default function CloudResourceManagement() {
    const navigate = useNavigate();

    // Context Hook values
    const { gcpCredentials, selectedGcpCredential, setSelectedGcpCredential } = useGCP();
    const { awsCredentials, selectedAwsCredential, setSelectedAwsCredential } = useAWS();

    const [activeTab, setActiveTab] = useState('compute');
    const [tabLoadings, setTabLoadings] = useState<Record<string, boolean>>({compute: false, storage: false, disks: false});
    const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
    const [dropdownProvider, setDropdownProvider] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Raw State values
    const [gcpInstances, setGcpInstances] = useState<any[]>([]);
    const [awsInstances, setAwsInstances] = useState<any[]>([]);
    const [gcpBuckets, setGcpBuckets] = useState<any[]>([]);
    const [awsBuckets, setAwsBuckets] = useState<any[]>([]);
    const [gcpDisks, setGcpDisks] = useState<any[]>([]);

    // Creation Dialogs
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [creationType, setCreationType] = useState<'compute' | 'storage' | null>(null);
    const [showGcpBucketWizard, setShowGcpBucketWizard] = useState(false);
    const [showAwsBucketWizard, setShowAwsBucketWizard] = useState(false);

    // Delete Modals
    const [deleteVMModal, setDeleteVMModal] = useState<{ open: boolean; instance: UnifiedCompute | null; loading: boolean }>({ open: false, instance: null, loading: false });
    const [deleteBucketModal, setDeleteBucketModal] = useState<{ open: boolean; bucket: UnifiedBucket | null; loading: boolean }>({ open: false, bucket: null, loading: false });
    const [deleteDiskModal, setDeleteDiskModal] = useState<{ open: boolean; disk: UnifiedDisk | null; loading: boolean }>({ open: false, disk: null, loading: false });

    // Backend-maintained unified vocabulary
    const [vocab, setVocab] = useState<any>(null);
    useEffect(() => {
        DefaultService.apiV1VocabGet().then(setVocab).catch(() => {});
    }, []);

    const getProviderLocation = useCallback((provider: string, locationId: string): string | null => {
        if (!vocab) return null;
        const loc = vocab.locations?.find((l: any) => l.id === locationId);
        if (!loc) return null;
        return provider === 'GCP' ? (loc.gcp ?? null) : (loc.aws ?? null);
    }, [vocab]);

    const getProviderInstanceType = useCallback((provider: string, planId: string, region?: string): string => {
        if (!vocab) return planId;
        const p = vocab.plans?.find((x: any) => x.id === planId);
        if (!p) return planId;
        if (provider === 'GCP') return p.gcp;
        if (region && p.aws_by_region && p.aws_by_region[region]) return p.aws_by_region[region];
        return p.aws;
    }, [vocab]);

    // API fetches
    const fetchGcpInstances = useCallback(async () => {
        try {
            const data = await DefaultService.apiV1GcpComputeInstancesLocalGet() as any;
            return data.instances || [];
        } catch {
            return [];
        }
    }, []);

    const fetchAwsInstances = useCallback(async () => {
        try {
            const data = await DefaultService.apiV1AwsComputeInstancesLocalGet() as any;
            return data.instances || [];
        } catch {
            return [];
        }
    }, []);

    const fetchGcpBuckets = useCallback(async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return [];
        try {
            const data = await DefaultService.apiV1StorageBucketsGet({
                credentialId: String(selectedGcpCredential.id),
                projectId: selectedGcpCredential.project_id,
            }) as any;
            return data.buckets || [];
        } catch {
            return [];
        }
    }, [selectedGcpCredential]);

    const fetchAwsBuckets = useCallback(async () => {
        if (!selectedAwsCredential?.id) return [];
        try {
            const data = await DefaultService.apiV1AwsStorageBucketsGet({
                credentialId: String(selectedAwsCredential.id),
            }) as any;
            return data.buckets || [];
        } catch {
            return [];
        }
    }, [selectedAwsCredential]);

    const fetchGcpDisks = useCallback(async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return [];
        try {
            const data = await DefaultService.apiV1GcpComputeDisksGet({
                credentialId: String(selectedGcpCredential.id),
                projectId: selectedGcpCredential.project_id,
            }) as any;
            return data.disks || [];
        } catch {
            return [];
        }
    }, [selectedGcpCredential]);

    const syncTab = useCallback(async (tab: string) => {
        setTabLoadings(prev => ({...prev, [tab]: true}));
        try {
            if (tab === 'compute') {
                const [gcp, aws] = await Promise.all([fetchGcpInstances(), fetchAwsInstances()]);
                setGcpInstances(gcp);
                setAwsInstances(aws);
            } else if (tab === 'storage') {
                const [gcp, aws] = await Promise.all([fetchGcpBuckets(), fetchAwsBuckets()]);
                setGcpBuckets(gcp);
                setAwsBuckets(aws);
            } else if (tab === 'disks') {
                const disks = await fetchGcpDisks();
                setGcpDisks(disks);
            }
        } finally {
            setTabLoadings(prev => ({...prev, [tab]: false}));
            setLoadedTabs(prev => new Set(prev).add(tab));
        }
    }, [fetchGcpInstances, fetchAwsInstances, fetchGcpBuckets, fetchAwsBuckets, fetchGcpDisks]);

    useEffect(() => {
        syncTab(activeTab);
    }, [selectedGcpCredential?.id, selectedAwsCredential?.id]);

    useEffect(() => {
        if (!loadedTabs.has(activeTab)) {
            syncTab(activeTab);
        }
    }, [activeTab]);

    // Data lists
    const unifiedComputeList = useMemo(() => {
        const gcp: UnifiedCompute[] = gcpInstances.map(i => ({
            id: i.name,
            name: i.name,
            provider: 'GCP',
            status: i.status,
            type: i.machine_type,
            location: i.zone,
            public_ip: i.external_ip || '—',
            raw: i,
        }));
        const aws: UnifiedCompute[] = awsInstances.map(i => ({
            id: i.instance_id,
            name: i.name || i.instance_id,
            provider: 'AWS',
            status: i.state,
            type: i.instance_type,
            location: i.availability_zone,
            public_ip: i.public_ip || '—',
            raw: i,
        }));
        return [...gcp, ...aws];
    }, [gcpInstances, awsInstances]);

    const unifiedBucketList = useMemo(() => {
        const gcp: UnifiedBucket[] = gcpBuckets.map(b => ({
            name: b.name,
            provider: 'GCP',
            location: b.location,
            storage_class: b.storage_class,
            created_at: b.created_at,
            raw: b,
        }));
        const aws: UnifiedBucket[] = awsBuckets.map(b => ({
            name: b.name,
            provider: 'AWS',
            location: 'Global',
            storage_class: 'S3 Standard',
            created_at: b.creation_date || '',
            raw: b,
        }));
        return [...gcp, ...aws];
    }, [gcpBuckets, awsBuckets]);

    const unifiedDiskList = useMemo(() => {
        return gcpDisks.map(d => ({
            name: d.name,
            provider: 'GCP' as const,
            type: d.type,
            zone: d.zone,
            size_gb: d.size_gb,
            status: d.status,
            raw: d,
        }));
    }, [gcpDisks]);

    // Delete Operations
    const executeVMDelete = async () => {
        const target = deleteVMModal.instance;
        if (!target) return;
        setDeleteVMModal(prev => ({ ...prev, loading: true }));

        try {
            if (target.provider === 'GCP') {
                if (!selectedGcpCredential?.id || !selectedGcpCredential?.project_id) return;
                const data = await DefaultService.apiV1GcpComputeInstancesInstanceNameDelete({
                    credentialId: String(selectedGcpCredential.id),
                    instanceName: target.name,
                    zone: target.location,
                }) as any;
                if (data.status === 'error') toast.error(data.message);
                else toast.success(`GCP VM "${target.name}" deletion queued`);
            } else {
                if (!selectedAwsCredential?.id) return;
                const data = await DefaultService.apiV1AwsComputeInstancesInstanceIdDelete({
                    credentialId: String(selectedAwsCredential.id),
                    instanceId: target.id,
                    region: target.raw.region,
                }) as any;
                toast.success(data.message || `AWS EC2 "${target.name}" deletion queued`);
            }
            syncTab('compute');
        } catch {
            toast.error('Failed to delete VM');
        } finally {
            setDeleteVMModal({ open: false, instance: null, loading: false });
        }
    };

    const executeBucketDelete = async () => {
        const target = deleteBucketModal.bucket;
        if (!target) return;
        setDeleteBucketModal(prev => ({ ...prev, loading: true }));

        try {
            if (target.provider === 'GCP') {
                if (!selectedGcpCredential?.id || !selectedGcpCredential?.project_id) return;
                const data = await DefaultService.apiV1StorageBucketsBucketNameDelete({
                    bucketName: target.name,
                    credentialId: String(selectedGcpCredential.id),
                    projectId: selectedGcpCredential.project_id,
                }) as any;
                if (data.status === 'error') toast.error(data.message);
                else toast.success(`GCP Bucket "${target.name}" deleted`);
            } else {
                if (!selectedAwsCredential?.id) return;
                const data = await DefaultService.apiV1AwsStorageBucketsBucketNameDelete({
                    bucketName: target.name,
                    credentialId: String(selectedAwsCredential.id),
                }) as any;
                if (data.status === 'error') toast.error(data.message);
                else toast.success(`S3 Bucket "${target.name}" deleted`);
            }
            syncTab('storage');
        } catch {
            toast.error('Failed to delete bucket');
        } finally {
            setDeleteBucketModal({ open: false, bucket: null, loading: false });
        }
    };

    const executeDiskDelete = async () => {
        const target = deleteDiskModal.disk;
        if (!target) return;
        setDeleteDiskModal(prev => ({ ...prev, loading: true }));

        try {
            if (!selectedGcpCredential?.id || !selectedGcpCredential?.project_id) return;
            const data = await DefaultService.apiV1GcpComputeDisksDiskNameDelete({
                credentialId: String(selectedGcpCredential.id),
                diskName: target.name,
                projectId: selectedGcpCredential.project_id,
                zone: target.zone,
            }) as any;
            if (data.status === 'error') toast.error(data.message);
            else toast.success(`GCP Disk "${target.name}" deleted`);
            syncTab('disks');
        } catch {
            toast.error('Failed to delete disk');
        } finally {
            setDeleteDiskModal({ open: false, disk: null, loading: false });
        }
    };

    // Unified Quick Create Submission
    const handleQuickCreateSubmit = async (values: any) => {
        if (values.provider === 'GCP') {
            if (!selectedGcpCredential?.id) return;
            try {
                const res: any = await DefaultService.apiV1GcpComputeInstancesPost({
                    credentialId: String(selectedGcpCredential.id),
                    requestBody: {
                        project_id: selectedGcpCredential.project_id ?? '',
                        instance_name: values.instanceName,
                        zone: getProviderLocation('GCP', values.zone),
                        machine_type: getProviderInstanceType('GCP', values.plan),
                        boot_disk_size_gb: values.minDiskGb || 10,
                        boot_disk_type: 'pd-balanced',
                        os_image: values.gcpImageUri || values.image,
                        selected_os_key: values.imageKey,
                    },
                } as any);
                if (res.status === 'error') toast.error(res.message);
                else { toast.success('GCP VM creation queued!'); setShowQuickCreate(false); syncTab('compute'); }
            } catch { toast.error('Failed to create GCP VM'); }
        } else {
            if (!selectedAwsCredential?.id) return;
            try {
                const awsRegion = getProviderLocation('AWS', values.zone);
                const res: any = await DefaultService.apiV1AwsComputeInstancesPost({
                    credentialId: String(selectedAwsCredential.id),
                    requestBody: {
                        instance_name: values.instanceName,
                        region: awsRegion,
                        image_id: values.awsImageId || values.image,
                        instance_type: getProviderInstanceType('AWS', values.plan, awsRegion || undefined),
                        bastion_enabled: true,
                    },
                } as any);
                if (res.status === 'error') toast.error(res.message);
                else { toast.success('AWS EC2 creation queued!'); setShowQuickCreate(false); syncTab('compute'); }
            } catch { toast.error('Failed to create AWS EC2'); }
        }
    };

    const handleGcpBucketSubmit = async (values: CreateStorageValues) => {
        if (!selectedGcpCredential?.id) return;
        try {
            const data: any = await DefaultService.apiV1StorageBucketsPost({
                credentialId: String(selectedGcpCredential.id),
                requestBody: {
                    project_id: selectedGcpCredential.project_id ?? '',
                    bucket_name: values.name,
                    location: values.location ?? '',
                    storage_class: values.storage_class,
                },
            } as any);
            if (data.status === 'error') toast.error(data.message);
            else {
                toast.success('GCP bucket created');
                setShowGcpBucketWizard(false);
                syncTab('storage');
            }
        } catch {
            toast.error('Failed to create GCP bucket');
        }
    };

    const handleAwsBucketSubmit = async (values: CreateS3BucketValues) => {
        if (!selectedAwsCredential?.id) return;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsPost({
                credentialId: String(selectedAwsCredential.id),
                requestBody: {
                    bucket_name: values.bucket_name.trim(),
                    region: values.region,
                    storage_class: values.storage_class,
                },
            } as any);
            if (data.status === 'error') toast.error(data.message);
            else {
                toast.success('S3 Bucket created successfully');
                setShowAwsBucketWizard(false);
                syncTab('storage');
            }
        } catch {
            toast.error('Failed to create S3 Bucket');
        }
    };

    // Columns
    const computeColumns = [
        {
            header: "Instance Name",
            accessor: "name",
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-950 flex items-center justify-center text-white border border-white/10 shadow-inner">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{row.name}</span>
                </div>
            )
        },
        {
            header: "Provider",
            accessor: "provider",
            cell: (row: any) => (
                <Badge className={`text-[10px] font-black tracking-tight border-none shadow-sm ${
                    row.provider === 'AWS' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                }`}>
                    {row.provider === 'AWS' ? 'AWS EC2' : 'GCP GCE'}
                </Badge>
            )
        },
        {
            header: "Status",
            accessor: "status",
            cell: (row: any) => {
                const s = row.status?.toLowerCase();
                if (s === 'running' || s === 'active') {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            RUNNING
                        </div>
                    );
                }
                if (s === 'terminated' || s === 'stopped') {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted/20 text-muted-foreground border border-border">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                            STOPPED
                        </div>
                    );
                }
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {row.status?.toUpperCase()}
                    </div>
                );
            }
        },
        { header: "Machine Type", accessor: "type", cell: (row: any) => <span className="font-mono text-xs font-semibold">{row.type}</span> },
        { header: "Zone/Region", accessor: "location", cell: (row: any) => <span className="text-xs text-muted-foreground font-medium">{row.location}</span> },
        { header: "IP Address", accessor: "public_ip", cell: (row: any) => <span className="font-mono text-xs text-foreground font-semibold">{row.public_ip}</span> },
    ];

    const bucketColumns = [
        {
            header: "Bucket Name", accessor: "name",
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-500/5 flex items-center justify-center text-blue-600 border border-blue-500/15">
                        <Box className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{row.name}</span>
                </div>
            )
        },
        {
            header: "Provider",
            accessor: "provider",
            cell: (row: any) => (
                <Badge className={`text-[10px] font-black tracking-tight border-none shadow-sm ${
                    row.provider === 'AWS' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                }`}>
                    {row.provider === 'AWS' ? 'AWS S3' : 'Google GCS'}
                </Badge>
            )
        },
        { header: "Location", accessor: "location", cell: (row: any) => <span className="text-xs font-medium text-muted-foreground">{row.location}</span> },
        { header: "Storage Class", accessor: "storage_class", cell: (row: any) => <Badge variant="outline" className="text-[10px] font-semibold">{row.storage_class}</Badge> },
        {
            header: "Created", accessor: "created_at",
            cell: (row: any) => (
                <span className="text-xs font-mono text-muted-foreground">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                </span>
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
            header: "Provider",
            accessor: "provider",
            cell: (row: any) => (
                <Badge className="text-[10px] font-black tracking-tight border-none shadow-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    GCP GCE
                </Badge>
            )
        },
        { header: "Disk Type", accessor: "type", cell: (row: any) => <span className="font-mono text-xs">{row.type}</span> },
        { header: "Zone", accessor: "zone", cell: (row: any) => <span className="text-xs text-muted-foreground">{row.zone}</span> },
        {
            header: "Capacity",
            accessor: "size_gb",
            cell: (row: any) => <span className="font-bold text-xs">{row.size_gb} GB</span>
        },
        {
            header: "Status",
            accessor: "status",
            cell: (row: any) => <Badge variant={row.status === 'READY' ? 'success' : 'outline'} className="text-[10px] font-black uppercase">{row.status}</Badge>
        },
    ];

    return (
        <PageLayout
            title="Cloud Resource Management"
            subtitle="Consolidated cloud operations and infrastructure orchestrator."
            icon={Cloud}
            actions={
                <div className="flex items-center gap-3">
                    {/* Multi-step Credential Selector */}
                    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open) setDropdownProvider(null); }}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm font-semibold border-border/80 hover:bg-muted/50 transition-all">
                                <Globe className="w-4 h-4 text-primary shrink-0" />
                                <div className="text-left leading-none max-w-[280px] truncate text-xs">
                                    <span className="text-muted-foreground mr-1">GCP:</span>
                                    <span className="text-foreground mr-3 font-bold">{selectedGcpCredential?.name || 'None'}</span>
                                    <span className="text-muted-foreground mr-1">AWS:</span>
                                    <span className="text-foreground font-bold">{selectedAwsCredential?.name || 'None'}</span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 overflow-hidden" align="end">
                            <div className="relative">
                                <div className={`transition-all duration-200 ${dropdownProvider ? '-translate-x-full opacity-0 absolute inset-0 pointer-events-none' : 'translate-x-0 opacity-100 relative'}`}>
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-3 py-2">
                                        Select Provider
                                    </DropdownMenuLabel>
                                    <div onClick={() => setDropdownProvider('gcp')} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-sm">
                                        <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <Cloud className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground">Google Cloud</span>
                                            <span className="text-[10px] text-muted-foreground">{gcpCredentials.length} credential{gcpCredentials.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto -rotate-90" />
                                    </div>
                                    <div onClick={() => setDropdownProvider('aws')} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-sm">
                                        <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground">Amazon Web Services</span>
                                            <span className="text-[10px] text-muted-foreground">{awsCredentials.length} credential{awsCredentials.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto -rotate-90" />
                                    </div>
                                </div>
                                <div className={`transition-all duration-200 ${dropdownProvider ? 'translate-x-0 opacity-100 relative' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}`}>
                                    <div onClick={() => setDropdownProvider(null)} className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer border-b hover:bg-accent rounded-sm">
                                        <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                                        <span className="font-semibold">Back</span>
                                    </div>
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-3 py-2">
                                        {dropdownProvider === 'gcp' ? 'Google Cloud (GCP)' : 'Amazon Web Services (AWS)'}
                                    </DropdownMenuLabel>
                                    {dropdownProvider === 'gcp' && (gcpCredentials.length === 0 ? (
                                        <div className="px-3 py-1.5 text-xs text-muted-foreground italic">No credentials found</div>
                                    ) : (
                                        gcpCredentials.map(cred => (
                                            <DropdownMenuItem 
                                                key={cred.id} 
                                                onClick={() => { setSelectedGcpCredential(cred.id); setDropdownOpen(false); }}
                                                className="flex items-center justify-between px-3 py-2 text-xs"
                                            >
                                                <span className="font-medium text-foreground truncate">{cred.name}</span>
                                                {selectedGcpCredential?.id === cred.id && (
                                                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                                                )}
                                            </DropdownMenuItem>
                                        ))
                                    ))}
                                    {dropdownProvider === 'aws' && (awsCredentials.length === 0 ? (
                                        <div className="px-3 py-1.5 text-xs text-muted-foreground italic">No credentials found</div>
                                    ) : (
                                        awsCredentials.map(cred => (
                                            <DropdownMenuItem 
                                                key={cred.id} 
                                                onClick={() => { setSelectedAwsCredential(cred.id); setDropdownOpen(false); }}
                                                className="flex items-center justify-between px-3 py-2 text-xs"
                                            >
                                                <span className="font-medium text-foreground truncate">{cred.name}</span>
                                                {selectedAwsCredential?.id === cred.id && (
                                                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-2" />
                                                )}
                                            </DropdownMenuItem>
                                        ))
                                    ))}
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2 border-border/40">
                    <Tabs
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: 'compute', label: 'Virtual Machines', icon: <Server className="w-3.5 h-3.5" /> },
                            { id: 'storage', label: 'Object Buckets', icon: <Box className="w-3.5 h-3.5" /> },
                            { id: 'disks', label: 'Persistent Disks', icon: <HardDrive className="w-3.5 h-3.5" /> }
                        ]}
                    />
                </div>

                {activeTab === 'compute' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <ResourceTable
                            title="VM & EC2 Instances"
                            description="Consolidated list of cloud compute platforms"
                            icon={<Cpu className="w-5 h-5 text-primary" />}
                            columns={computeColumns}
                            data={unifiedComputeList.map(item => ({
                                ...item,
                                showPlay: false, showStop: false, showPause: false, showClone: false,
                                showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false,
                                showPush: false, showViewDetails: true, showDelete: true
                            }))}
                            loading={tabLoadings['compute']}
                            extraHeaderContent={
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => syncTab('compute')} disabled={tabLoadings['compute']} variant="outline" className="font-black text-[10px] uppercase h-9">
                                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${tabLoadings['compute'] ? 'animate-spin' : ''}`} /> Sync
                                    </Button>
                                    <Button size="sm" onClick={() => setShowQuickCreate(true)} className="font-black text-[10px] uppercase tracking-widest px-6 h-9">
                                        <Plus className="w-3.5 h-3.5 mr-2" /> Create Instance
                                    </Button>
                                </div>
                            }
                            onViewDetails={(row: any) => {
                                if (row.provider === 'GCP') {
                                    navigate(`/settings/gcp/compute/instances/${row.name}?zone=${row.location}`);
                                } else {
                                    navigate(`/settings/aws/compute/instances/${row.id}?region=${encodeURIComponent(row.raw.region)}`);
                                }
                            }}
                            onDelete={(row: any) => {
                                setDeleteVMModal({ open: true, instance: row, loading: false });
                            }}
                        />
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <ResourceTable
                            title="Cloud Buckets"
                            description="Consolidated Object Storage buckets"
                            icon={<Box className="w-5 h-5 text-primary" />}
                            columns={bucketColumns}
                            data={unifiedBucketList.map(item => ({
                                ...item,
                                showPlay: false, showStop: false, showPause: false, showClone: false,
                                showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false,
                                showPush: false, showViewDetails: true, showDelete: true
                            }))}
                            loading={tabLoadings['storage']}
                            extraHeaderContent={
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => syncTab('storage')} disabled={tabLoadings['storage']} variant="outline" className="font-black text-[10px] uppercase h-9">
                                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${tabLoadings['storage'] ? 'animate-spin' : ''}`} /> Sync
                                    </Button>
                                    <Button size="sm" onClick={() => setCreationType('storage')} className="font-black text-[10px] uppercase tracking-widest px-6 h-9">
                                        <Plus className="w-3.5 h-3.5 mr-2" /> Create Bucket
                                    </Button>
                                </div>
                            }
                            onViewDetails={(row: any) => {
                                if (row.provider === 'GCP') {
                                    navigate(`/settings/gcp/storage/buckets/${row.name}`);
                                } else {
                                    navigate(`/settings/aws/storage/buckets/${row.name}`);
                                }
                            }}
                            onDelete={(row: any) => {
                                setDeleteBucketModal({ open: true, bucket: row, loading: false });
                            }}
                        />
                    </div>
                )}

                {activeTab === 'disks' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <ResourceTable
                            title="Persistent Volumes"
                            description="Block storage persistent disks"
                            icon={<HardDrive className="w-5 h-5 text-slate-700" />}
                            columns={diskColumns}
                            data={unifiedDiskList.map(item => ({
                                ...item,
                                showPlay: false, showStop: false, showPause: false, showClone: false,
                                showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false,
                                showPush: false, showViewDetails: false, showDelete: true
                            }))}
                            loading={tabLoadings['disks']}
                            extraHeaderContent={
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => syncTab('disks')} disabled={tabLoadings['disks']} variant="outline" className="font-black text-[10px] uppercase h-9">
                                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${tabLoadings['disks'] ? 'animate-spin' : ''}`} /> Sync
                                    </Button>
                                </div>
                            }
                            onDelete={(row: any) => {
                                setDeleteDiskModal({ open: true, disk: row, loading: false });
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Storage Provider Dialog */}
            <Dialog open={creationType === 'storage'} onOpenChange={(open) => !open && setCreationType(null)}>
                <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh]">
                    <div className="flex flex-col h-full">
                        <DialogHeader className="px-8 pt-8 pb-0">
                            <DialogTitle className="text-xl">Select Cloud Provider</DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                Where would you like to create your storage bucket?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 grid grid-cols-2 gap-6 p-8">
                            <Button
                                variant="outline"
                                className="h-full min-h-[240px] flex flex-col items-center justify-center gap-4 border-2 border-border hover:border-blue-500 hover:bg-blue-500/5 transition-all group rounded-xl"
                                onClick={() => { setShowGcpBucketWizard(true); setCreationType(null); }}
                            >
                                <Cloud className="h-12 w-12 text-blue-500 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="text-lg font-bold block">Google Cloud</span>
                                    <span className="text-xs text-muted-foreground mt-1 block">Cloud Storage Buckets</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full min-h-[240px] flex flex-col items-center justify-center gap-4 border-2 border-border hover:border-amber-500 hover:bg-amber-500/5 transition-all group rounded-xl"
                                onClick={() => { setShowAwsBucketWizard(true); setCreationType(null); }}
                            >
                                <Database className="h-12 w-12 text-amber-500 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="text-lg font-bold block">Amazon AWS</span>
                                    <span className="text-xs text-muted-foreground mt-1 block">S3 Buckets</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Create Wizard (unified GCP + AWS) */}
            <QuickCreateWizard
                projectId={selectedGcpCredential?.project_id || ''}
                gcpCredentialId={selectedGcpCredential?.id}
                awsCredentialId={selectedAwsCredential?.id}
                gcpCredentials={gcpCredentials}
                awsCredentials={awsCredentials}
                onSelectGcpCredential={setSelectedGcpCredential}
                onSelectAwsCredential={setSelectedAwsCredential}
                isWizardOpen={showQuickCreate}
                setIsWizardOpen={setShowQuickCreate}
                onSubmit={handleQuickCreateSubmit}
            />



            {/* GCP Storage Bucket Wizard */}
            <CreateStorageWizard
                projectId={selectedGcpCredential?.project_id || ""}
                isWizardOpen={showGcpBucketWizard}
                setIsWizardOpen={setShowGcpBucketWizard}
                onSubmit={handleGcpBucketSubmit}
                defaultType="bucket"
            />

            {/* AWS S3 Bucket Wizard */}
            <CreateS3BucketWizard
                isWizardOpen={showAwsBucketWizard}
                setIsWizardOpen={setShowAwsBucketWizard}
                onSubmit={handleAwsBucketSubmit}
            />

            {/* Delete VM Alert Dialog */}
            <AlertDialog open={deleteVMModal.open} onOpenChange={(v) => !v && setDeleteVMModal({ open: false, instance: null, loading: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle>Delete Compute Instance</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to terminate the {deleteVMModal.instance?.provider} instance <strong>{deleteVMModal.instance?.name}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteVMModal.loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleteVMModal.loading}
                            onClick={executeVMDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteVMModal.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Bucket Alert Dialog */}
            <AlertDialog open={deleteBucketModal.open} onOpenChange={(v) => !v && setDeleteBucketModal({ open: false, bucket: null, loading: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle>Delete Storage Bucket</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to delete the {deleteBucketModal.bucket?.provider} bucket <strong>{deleteBucketModal.bucket?.name}</strong>?
                            This will fail if the bucket is not empty.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBucketModal.loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleteBucketModal.loading}
                            onClick={executeBucketDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteBucketModal.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Disk Alert Dialog */}
            <AlertDialog open={deleteDiskModal.open} onOpenChange={(v) => !v && setDeleteDiskModal({ open: false, disk: null, loading: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle>Delete Persistent Disk</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to delete persistent disk <strong>{deleteDiskModal.disk?.name}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteDiskModal.loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleteDiskModal.loading}
                            onClick={executeDiskDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteDiskModal.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
}

import React, { useEffect, useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Database, Box, HardDrive, Loader2, AlertCircle, RefreshCw, Shield, Layers, Zap, Key, Calculator, TrendingUp, DollarSign, FolderOpen } from 'lucide-react';
import { cn } from '@/libs/utils';
import { CostEstimateWidget } from '@/components/gcp/CostEstimateWidget';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/libs/auth';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { GCPErrorBanner } from '@/components/GCPErrorBanner';

interface CostEstimateParams {
    resource_type: 'bucket' | 'disk' | 'filestore' | 'vm';
    storage_class?: string;
    size_gb?: number;
    location?: string;
    disk_type?: string;
    zone?: string;
    machine_type?: string;
    tier?: string;
    autoclass_enabled?: boolean;
    versioning_enabled?: boolean;
    soft_delete_days?: number;
    encryption_kms_key?: string;
    hierarchical_namespace_enabled?: boolean;
}

interface EstimateResult {
    available: boolean;
    monthly_estimate?: number;
    per_gb_price?: number;
    currency?: string;
    reason?: string;
    sku_description?: string;
    project_id?: string;
    status?: string;
    error_type?: string;
    message?: string;
    action_required?: string;
    service_name?: string;
    breakdown?: {
        base_storage: number;
        per_gb_price: number;
        surcharges: Record<string, number>;
        total_surcharges: number;
    };
    features_applied?: Record<string, any>;
}

const STORAGE_CLASSES = [
    { id: "STANDARD", name: "Standard", description: "Frequently accessed data. No minimum duration." },
    { id: "NEARLINE", name: "Nearline", description: "Accessed less than once a month. 30-day minimum." },
    { id: "COLDLINE", name: "Coldline", description: "Accessed less than once a quarter. 90-day minimum." },
    { id: "ARCHIVE", name: "Archive", description: "Rarely accessed archival data. 365-day minimum." },
];

interface ConfigStepProps {
    form: UseFormReturn<any>;
    metadata: any;
    loading: boolean;
    error?: string | null;
    onRetry?: () => void;
    diskTypesByZone?: Record<string, any[]>;
    fetchDiskTypesForZone?: (zone: string) => void;
}

export const TypeStep = ({ form }: { form: UseFormReturn<any> }) => {
    const options = [
        {
            id: 'bucket',
            label: 'Object Storage',
            sub: 'Buckets',
            icon: Box,
            desc: 'Globally unique containers for unstructured data.',
        },
        {
            id: 'disk',
            label: 'Block Storage',
            sub: 'Persistent Disks',
            icon: HardDrive,
            desc: 'Durable network storage for VM instances.',
        },
        {
            id: 'filestore',
            label: 'File Storage',
            sub: 'Filestore',
            icon: FolderOpen,
            desc: 'Managed NFS file shares for simultaneous multi-instance mounting.',
        },
    ];

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="resource_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Storage Type</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                            {options.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => field.onChange(type.id)}
                                    className={cn(
                                        "p-4 border rounded-md text-left transition-all relative group",
                                        field.value === type.id
                                            ? "border-primary ring-1 ring-primary bg-primary/5"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <type.icon className={cn("w-5 h-5", field.value === type.id ? "text-primary" : "text-muted-foreground")} />
                                        <div className="font-bold text-sm">{type.label}</div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed pr-2">
                                        {type.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export const IdentityStep = ({ form }: { form: UseFormReturn<any> }) => {
    const type = form.watch('resource_type');

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{type === 'bucket' ? 'Bucket' : 'Disk'} Name</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={type === 'bucket' ? 'e.g. static-assets' : 'e.g. data-volume'}
                            />
                        </FormControl>
                        <FormDescription>
                            {type === 'bucket'
                                ? "We'll append a unique identifier for global uniqueness."
                                : "A unique name for this disk in the selected zone."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <FormLabel>Target Project</FormLabel>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{form.getValues('project_id')}</span>
                </div>
            </div>
        </div>
    );
};

const SelectSkeleton = () => (
    <div className="flex items-center gap-2 p-2.5 border rounded-md bg-muted/20 animate-pulse">
        <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
    </div>
);

const DropdownSkeleton = () => (
    <div className="space-y-2">
        <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
        <SelectSkeleton />
    </div>
);

export const ConfigStep = ({
    form,
    metadata,
    loading,
    error,
    onRetry
}: ConfigStepProps) => {
    const type = form.watch('resource_type');
    const currentZone = form.watch('zone');
    const currentLocation = form.watch('location');
    const diskType = form.watch('disk_type');
    const sizeGb = form.watch('size_gb');
    const storageClass = form.watch('storage_class');

    if (error) {
        return (
            <div className="py-4 space-y-4">
                <div className="flex items-start gap-3 p-4 border border-red-200 rounded-lg bg-red-50/50">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700">Metadata Unavailable</p>
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 h-8">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6 py-2">
                <DropdownSkeleton />
                <DropdownSkeleton />
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-xs font-medium">Fetching options from GCP...</span>
                </div>
            </div>
        );
    }

    if (type === 'disk') {
        return <DiskConfigStep form={form} metadata={metadata} diskTypesByZone={diskTypesByZone || {}} fetchDiskTypesForZone={fetchDiskTypesForZone} />;
    }

    if (type === 'filestore') {
        return <FilestoreConfigStep form={form} metadata={metadata} />;
    }

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {metadata?.storage_locations?.map((loc: any) => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="storage_class"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Storage Class</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                            {STORAGE_CLASSES.map((cls) => (
                                <button
                                    key={cls.id}
                                    type="button"
                                    onClick={() => field.onChange(cls.id)}
                                    className={`px-4 py-3 border rounded-md text-sm font-medium transition-all text-left ${field.value === cls.id
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted'
                                        }`}
                                >
                                    <div className="font-bold">{cls.name}</div>
                                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight font-normal">{cls.description}</div>
                                </button>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    Storage Management
                </h4>

                <FormField
                    control={form.control}
                    name="autoclass_enabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm">Autoclass</FormLabel>
                                <FormDescription className="text-[11px]">
                                    Automatically moves data to cheaper storage classes based on access patterns.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="hierarchical_namespace_enabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm">Hierarchical Namespace</FormLabel>
                                <FormDescription className="text-[11px]">
                                    Enables filesystem-like directory operations. Optimized for AI/ML workloads.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="versioning_enabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm">Object Versioning</FormLabel>
                                <FormDescription className="text-[11px]">
                                    Keep noncurrent versions of objects for recovery purposes.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Data Protection
                </h4>

                <FormField
                    control={form.control}
                    name="soft_delete_days"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Soft Delete Retention (days)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={0}
                                    max={365}
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormDescription className="text-[11px]">
                                Retain deleted objects for recovery. 0 to use GCP default (7 days).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="encryption_kms_key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Key className="w-3.5 h-3.5" />
                                Encryption Key (KMS)
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Leave empty for Google-managed encryption"
                                />
                            </FormControl>
                            <FormDescription className="text-[11px]">
                                Optional Cloud KMS key ring for customer-managed encryption (CMEK).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

const DiskConfigStep = ({ form, metadata, diskTypesByZone, fetchDiskTypesForZone }: { form: UseFormReturn<any>; metadata: any; diskTypesByZone: Record<string, any[]>; fetchDiskTypesForZone?: (zone: string) => void }) => {
    const currentZone = form.watch('zone');
    const prevZoneRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (currentZone && currentZone !== prevZoneRef.current) {
            prevZoneRef.current = currentZone;
            form.setValue('disk_type', '');
            fetchDiskTypesForZone?.(currentZone);
        }
    }, [currentZone, fetchDiskTypesForZone, form]);

    const diskTypes = currentZone ? (diskTypesByZone[currentZone] || []) : [];
    const isLoading = currentZone && !diskTypesByZone[currentZone];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zone</FormLabel>
                            <Select onValueChange={(val) => { field.onChange(val); form.setValue('disk_type', ''); }} value={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select zone" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {metadata?.zones?.map((z: any) => (
                                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="size_gb"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Size (GB)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="disk_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Disk Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isLoading || !currentZone}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoading ? 'Loading disk types...' : 'Select disk type'} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="px-2 py-3 text-xs text-muted-foreground flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Fetching disk types...
                                    </div>
                                ) : diskTypes.length > 0 ? diskTypes.map((dt: any) => (
                                    <SelectItem key={dt.id} value={dt.id}>
                                        <div>
                                            <div className="font-medium">{dt.id}</div>
                                            <div className="text-[10px] text-muted-foreground">{dt.description}</div>
                                        </div>
                                    </SelectItem>
                                )) : (
                                    <div className="px-2 py-3 text-xs text-muted-foreground">
                                        {currentZone ? 'No disk types available in this zone' : 'Select a zone first'}
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

const FilestoreConfigStep = ({ form, metadata }: { form: UseFormReturn<any>; metadata: any }) => {
    const [tiers, setTiers] = useState<any[]>([
        { id: 'STANDARD', name: 'Standard', description: 'HDD-backed, cost-effective for general workloads' },
        { id: 'PREMIUM', name: 'Premium', description: 'SSD-backed, high-performance for latency-sensitive workloads' },
    ]);

    const filestoreError = metadata?.errors?.filestore_locations;

    if (filestoreError) {
        return (
            <div className="space-y-6">
                <GCPErrorBanner error={filestoreError} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select zone" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {metadata?.zones?.map((z: any) => (
                                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instance ID</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. nfs-share-01" />
                        </FormControl>
                        <FormDescription>A unique name for this Filestore instance in the selected zone.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="file_share_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>File Share Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. vol1" />
                        </FormControl>
                        <FormDescription>The mounting directory target for the NFS share.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="size_gb"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacity (GB)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1024}
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormDescription>Minimum 1024 GB (1 TB) for standard instances.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="filestore_tier"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {tiers.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div>
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{t.description}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

export const CostingStep = ({ form }: { form: UseFormReturn<any> }) => {
    const type = form.watch('resource_type');
    const currentZone = form.watch('zone');
    const currentLocation = form.watch('location');
    const diskType = form.watch('disk_type');
    const sizeGb = form.watch('size_gb');
    const storageClass = form.watch('storage_class');
    const autoclassEnabled = form.watch('autoclass_enabled');
    const versioningEnabled = form.watch('versioning_enabled');
    const softDeleteDays = form.watch('soft_delete_days');
    const encryptionKmsKey = form.watch('encryption_kms_key');
    const hierarchicalNamespaceEnabled = form.watch('hierarchical_namespace_enabled');
    const filestoreTier = form.watch('filestore_tier');

    const isBucketParamsReady = type === 'bucket' && storageClass && currentLocation;
    const isDiskParamsReady = type === 'disk' && diskType && currentZone && sizeGb > 0;
    const isFilestoreParamsReady = type === 'filestore' && currentZone && sizeGb >= 1024;
    const showEstimation = isBucketParamsReady || isDiskParamsReady || isFilestoreParamsReady;

    return (
        <div className="space-y-6">
            {!showEstimation && (
                <div className="flex items-start gap-3 p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-700">Configuration Required</p>
                        <p className="text-xs text-amber-600 mt-1">Complete the configuration step to see cost estimates.</p>
                    </div>
                </div>
            )}

            {showEstimation && type === 'bucket' && (
                <DualCardEstimate
                    key={`bucket-${storageClass}-${currentLocation}`}
                    resourceType="bucket"
                    params={{
                        storage_class: storageClass,
                        size_gb: sizeGb || 10,
                        location: currentLocation,
                        autoclass_enabled: autoclassEnabled || false,
                        versioning_enabled: versioningEnabled || false,
                        soft_delete_days: softDeleteDays || undefined,
                        encryption_kms_key: encryptionKmsKey || undefined,
                        hierarchical_namespace_enabled: hierarchicalNamespaceEnabled || false,
                    }}
                    provisionedSize={sizeGb || 10}
                />
            )}

            {showEstimation && type === 'disk' && (
                <DualCardEstimate
                    key={`disk-${diskType}-${currentZone}`}
                    resourceType="disk"
                    params={{
                        disk_type: diskType,
                        size_gb: sizeGb,
                        zone: currentZone,
                    }}
                    provisionedSize={sizeGb || 0}
                />
            )}

            {showEstimation && type === 'filestore' && (
                <DualCardEstimate
                    key={`filestore-${filestoreTier || 'STANDARD'}-${currentZone}`}
                    resourceType="filestore"
                    params={{
                        size_gb: sizeGb || 1024,
                        zone: currentZone,
                        tier: filestoreTier || 'STANDARD',
                    }}
                    provisionedSize={sizeGb || 1024}
                />
            )}
        </div>
    );
};

const SCALE_TIERS = [100, 500, 1000];

interface DualCardEstimateProps {
    resourceType: 'bucket' | 'disk' | 'filestore';
    params: Omit<CostEstimateParams, 'resource_type'>;
    provisionedSize: number;
}

function DualCardEstimate({ resourceType, params, provisionedSize }: DualCardEstimateProps) {
    const { selectedGcpCredential } = useGCP();
    const [estimate, setEstimate] = useState<EstimateResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTier, setSelectedTier] = useState(500);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>('');

    const hasCredential = !!selectedGcpCredential;

    useEffect(() => {
        if (!hasCredential) {
            setEstimate(null);
            return;
        }

        const q = new URLSearchParams({ resource_type: resourceType });
        if (params.storage_class) q.set('storage_class', params.storage_class);
        if (params.size_gb !== undefined) q.set('size_gb', String(params.size_gb));
        if (params.location) q.set('location', params.location);
        if (params.disk_type) q.set('disk_type', params.disk_type);
        if (params.zone) q.set('zone', params.zone);
        if (params.tier) q.set('tier', params.tier);
        if (params.autoclass_enabled !== undefined) q.set('autoclass_enabled', String(params.autoclass_enabled));
        if (params.versioning_enabled !== undefined) q.set('versioning_enabled', String(params.versioning_enabled));
        if (params.soft_delete_days !== undefined) q.set('soft_delete_days', String(params.soft_delete_days));
        if (params.encryption_kms_key) q.set('encryption_kms_key', params.encryption_kms_key);
        if (params.hierarchical_namespace_enabled !== undefined) q.set('hierarchical_namespace_enabled', String(params.hierarchical_namespace_enabled));

        const query = q.toString();
        if (query === lastQueryRef.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            lastQueryRef.current = query;
            setLoading(true);

            try {
                const token = getAuthToken();
                const res = await fetch(`/api/v1/pricing/estimate?${query}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-GCP-Credential-ID': String(selectedGcpCredential!.id),
                    },
                });
                const data = await res.json();
                setEstimate(data);
            } catch {
                setEstimate({ available: false, reason: 'Network error. Check connection.' });
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [
        resourceType,
        params.storage_class,
        params.size_gb,
        params.location,
        params.disk_type,
        params.zone,
        params.tier,
        params.autoclass_enabled,
        params.versioning_enabled,
        params.soft_delete_days,
        params.encryption_kms_key,
        params.hierarchical_namespace_enabled,
        selectedGcpCredential,
        hasCredential
    ]);

    if (!hasCredential) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Select GCP Credential</p>
                    <p className="text-xs text-amber-600">Add a GCP Service Account in the Credential Hub to enable pricing.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">Fetching pricing...</span>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">Calculating scale...</span>
                </div>
            </div>
        );
    }

    if (!estimate || !estimate.available) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700">Estimate Unavailable</p>
                    <p className="text-xs text-red-600">{estimate?.reason || 'Could not fetch pricing data.'}</p>
                </div>
            </div>
        );
    }

    const currency = estimate.currency || 'USD';
    let unitRatePerGB = estimate.breakdown?.per_gb_price ?? estimate.price_per_unit ?? 0;

    const isAutoclassActive = params.autoclass_enabled === true ||
        (estimate.sku_description?.toLowerCase().includes('autoclass') ?? false);

    if (isAutoclassActive && unitRatePerGB === 0) {
        unitRatePerGB = 0.023;
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);

    const hasSurcharges = estimate.breakdown && Object.keys(estimate.breakdown.surcharges).length > 0;
    const hasAutoclass = params.autoclass_enabled === true;
    const hasHierarchicalNs = params.hierarchical_namespace_enabled === true;
    const showOperationPill = resourceType === 'bucket' && (hasAutoclass || hasHierarchicalNs);

    const baselineCost = resourceType === 'bucket'
        ? 0.00
        : (unitRatePerGB * provisionedSize);

    const simulatedCost = unitRatePerGB * selectedTier;
    const snapshotOverhead = (resourceType === 'disk' || resourceType === 'filestore') ? simulatedCost * 0.10 : 0;
    const totalSimulated = simulatedCost + snapshotOverhead;
    const showScaleTiers = resourceType === 'bucket';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Baseline Configuration Cost</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-700 tracking-tight">{formatCurrency(baselineCost)}</span>
                        <span className="text-xs font-bold text-emerald-500 uppercase">/ month</span>
                    </div>

                    {resourceType === 'bucket' ? (
                        <p className="text-[11px] text-emerald-600">Fixed baseline or empty resource cost.</p>
                    ) : resourceType === 'filestore' ? (
                        <p className="text-[11px] text-emerald-600">Based on your provisioned capacity of {provisionedSize} GB ({params.tier || 'STANDARD'} tier).</p>
                    ) : (
                        <p className="text-[11px] text-emerald-600">Based on your provisioned size of {provisionedSize} GB.</p>
                    )}

                    {unitRatePerGB > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{formatCurrency(unitRatePerGB)} per GB</span>
                        </div>
                    )}

                    {hasSurcharges && estimate.breakdown && (
                        <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                            {Object.entries(estimate.breakdown.surcharges).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-xs text-emerald-600">
                                    <span className="capitalize">{key.replace('_', ' ')}</span>
                                    <span>+{formatCurrency(value)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {estimate.sku_description && (
                        <div className="text-[10px] text-emerald-600 bg-emerald-100/60 px-2 py-1.5 rounded border border-emerald-200">
                            <span className="font-semibold">Matched SKU:</span> {estimate.sku_description}
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-blue-100 flex items-center justify-center">
                            <Calculator className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-blue-700">Estimated Cost at Scale</span>
                    </div>

                    {showScaleTiers && (
                        <div className="flex gap-1.5">
                            {SCALE_TIERS.map((tier) => (
                                <button
                                    key={tier}
                                    type="button"
                                    onClick={() => setSelectedTier(tier)}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedTier === tier
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-blue-100/60 text-blue-700 hover:bg-blue-100'
                                        }`}
                                >
                                    {tier >= 1000 ? `${tier / 1000} TB` : `${tier} GB`}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-700 tracking-tight">{formatCurrency(totalSimulated)}</span>
                        <span className="text-xs font-bold text-blue-500 uppercase">/ month</span>
                    </div>

                    {resourceType === 'bucket' ? (
                        <p className="text-[11px] text-blue-600">
                            Projected at {selectedTier >= 1000 ? `${selectedTier / 1000} TB` : `${selectedTier} GB`} of active storage data.
                        </p>
                    ) : (
                        <p className="text-[11px] text-blue-600">
                            {formatCurrency(simulatedCost)} capacity + {formatCurrency(snapshotOverhead)} backup/snapshot overhead (10% daily differential).
                        </p>
                    )}

                    {showOperationPill && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 border border-amber-200">
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span className="text-[10px] font-semibold text-amber-700">+ Operation Fees Apply</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Estimation Notes</span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>Prices are fetched live from the GCP Cloud Billing API</li>
                    <li>Estimates reflect list pricing and exclude committed-use discounts</li>
                    <li>Network egress and operation costs are not included</li>
                    <li>Actual billing may vary based on usage patterns</li>
                </ul>
            </div>
        </div>
    );
}

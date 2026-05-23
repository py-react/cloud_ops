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
import { Server, Loader2, DollarSign, AlertCircle, Calculator, HardDrive, Key } from 'lucide-react';
import { cn } from '@/libs/utils';
import { getAuthToken } from '@/libs/auth';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';

const RUNTIME_TIERS = [
    { id: 730, label: "24/7 Runtime (730h)" },
    { id: 220, label: "Business Hours (220h)" },
    { id: 100, label: "Dev/Test (100h)" }
];

const MACHINE_TYPES = [
    { id: 'e2-micro', label: 'e2-micro', sub: '0.25 vCPU · 1 GB RAM · Shared' },
    { id: 'e2-small', label: 'e2-small', sub: '0.5 vCPU · 2 GB RAM · Shared' },
    { id: 'e2-medium', label: 'e2-medium', sub: '1 vCPU · 4 GB RAM · Shared' },
    { id: 'e2-standard-2', label: 'e2-standard-2', sub: '2 vCPU · 8 GB RAM · Dedicated' },
    { id: 'e2-standard-4', label: 'e2-standard-4', sub: '4 vCPU · 16 GB RAM · Dedicated' },
    { id: 'n2-standard-2', label: 'n2-standard-2', sub: '2 vCPU · 8 GB RAM · Balanced' },
];

export const VMIdentityStep = ({ form }: { form: UseFormReturn<any> }) => {
    const name = form.watch('instance_name');
    const isInvalid = name && (name.length < 3 || !/^[a-z0-9-]+$/.test(name));
    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="instance_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instance Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. api-server-01" className="font-mono text-sm" />
                        </FormControl>
                        <FormDescription>
                            RFC1035 compliant. Lowercase letters, numbers, and hyphens only.
                        </FormDescription>
                        {isInvalid && (
                            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 mt-2 flex items-start gap-2 animate-in fade-in duration-200">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-red-700">Invalid VM Name</p>
                                    <p className="text-xs text-red-600">Must be at least 3 characters and contain lowercase letters, numbers, and hyphens only.</p>
                                </div>
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <FormLabel>Target Project</FormLabel>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{form.getValues('project_id')}</span>
                </div>
            </div>
        </div>
    );
};

export const VMConfigStep = ({
    form,
    metadata,
    loading,
    bastionKeys = [],
    loadingKeys = false,
    images = [],
}: {
    form: UseFormReturn<any>;
    metadata: any;
    loading: boolean;
    bastionKeys?: any[];
    loadingKeys?: boolean;
    images?: any[];
}) => {
    const currentZone = form.watch('zone');
    const currentOsKey = form.watch('selected_os_key');
    const selectedImage = images.find((img: any) => img.id === form.watch('os_image'));
    const minDiskGb = selectedImage?.min_disk_gb || 10;
    const isWindowsSelected = currentOsKey ? (images.find((img: any) => img.osKey === currentOsKey)?.os_family === 'windows') : false;

    useEffect(() => {
        if (!currentZone && metadata?.zones?.length > 0) {
            form.setValue('zone', metadata.zones[0].id);
        }
    }, [currentZone, metadata, form]);

    useEffect(() => {
        if (isWindowsSelected) {
            form.setValue('machine_type', 'e2-medium');
        } else if (form.watch('machine_type') === 'e2-medium') {
            form.setValue('machine_type', 'e2-micro');
        }
    }, [isWindowsSelected, form]);

    const availableMachineTypes = isWindowsSelected
        ? MACHINE_TYPES.filter(mt => mt.id !== 'e2-micro' && mt.id !== 'e2-small')
        : MACHINE_TYPES;

    if (loading) {
        return (
            <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-4" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-muted rounded animate-pulse" />
                    <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 bg-muted rounded animate-pulse" />
                <div className="h-28 bg-muted rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="os_image"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Operating System Image</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            const selected = images.find((img: any) => img.gcp_uri === value || img.osKey === value || img.id === value);
                            if (selected?.osKey) {
                                form.setValue('selected_os_key', selected.osKey);
                            }
                            if (selected?.min_disk_gb) {
                                form.setValue('boot_disk_size_gb', Math.max(form.watch('boot_disk_size_gb') || 10, selected.min_disk_gb));
                            }
                        }} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select OS Image" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {images.map((img: any) => (
                                    <SelectItem key={img.osKey || img.id} value={img.gcp_uri || img.id}>{img.label || img.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 gap-4">
                <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <FormField
                control={form.control}
                name="machine_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Machine Type</FormLabel>
                        {isWindowsSelected && (
                            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2.5 mb-3 flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-amber-700 font-medium">Windows Server Core requires a minimum of 4GB RAM (e2-medium) for initial boot.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            {availableMachineTypes.map((mt) => (
                                <button
                                    key={mt.id}
                                    type="button"
                                    onClick={() => field.onChange(mt.id)}
                                    className={cn(
                                        "p-3 border rounded-md text-left transition-all",
                                        field.value === mt.id
                                            ? "border-primary ring-1 ring-primary bg-primary/5"
                                             : "hover:bg-muted"
                                    )}
                                >
                                    <div className="font-bold text-sm">{mt.label}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">{mt.sub}</div>
                                </button>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Boot Disk Configuration Card Section */}
            <div className="rounded-lg border bg-card p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Boot Disk Configuration</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="boot_disk_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Boot Disk Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select disk type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pd-balanced">Balanced Persistent Disk (pd-balanced)</SelectItem>
                                        <SelectItem value="pd-standard">Standard Persistent Disk (pd-standard)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="boot_disk_size_gb"
                        render={({ field }) => {
                            const isBelowMin = (field.value || 10) < minDiskGb;
                            return (
                                <FormItem>
                                    <FormLabel>Disk Size (GB)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={minDiskGb}
                                            max={2000}
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value) || minDiskGb)}
                                        />
                                    </FormControl>
                                    {isBelowMin && (
                                        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 mt-2 flex items-start gap-2">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-amber-700 font-medium">Minimum {minDiskGb} GB required for selected OS image</p>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </div>

            {/* Access & Security Card Section */}
            <div className="rounded-lg border bg-card p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Key className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Access & Security (Bastion Integration)</span>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">Default SSH Username</span>
                            <div className="p-2 border rounded-md bg-muted font-mono text-sm text-foreground font-bold">
                                admin
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">Password Assignment</span>
                            <div className="p-2 border rounded-md bg-muted font-mono text-xs text-foreground font-bold flex items-center gap-1.5 truncate">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                Cryptographically Secure Random String
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        A random, unique administrator password will be automatically generated for this instance and executed on the guest OS at boot time. The default username is set to <span className="font-bold text-foreground font-mono">admin</span>. You will be able to reveal and copy this password exactly once from the instance details page to complete your Bastion onboarding.
                    </p>
                </div>
            </div>
        </div>
    );
};


// Step 3: Cost Estimate
export const VMDualCardEstimate = ({
    machineType,
    zone,
    bootDiskSizeGb,
    bootDiskType,
}: {
    machineType: string;
    zone: string;
    bootDiskSizeGb: number;
    bootDiskType: string;
}) => {
    const { selectedGcpCredential } = useGCP();
    const [estimate, setEstimate] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [runtimeHours, setRuntimeHours] = useState(730);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>('');

    const hasCredential = !!selectedGcpCredential;

    useEffect(() => {
        if (!hasCredential || !machineType || !zone) {
            setEstimate(null);
            return;
        }

        const q = new URLSearchParams({
            resource_type: 'vm',
            machine_type: machineType,
            zone: zone,
            size_gb: String(bootDiskSizeGb),
            disk_type: bootDiskType,
        });
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
    }, [machineType, zone, bootDiskSizeGb, bootDiskType, selectedGcpCredential, hasCredential]);

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
                    <span className="text-xs font-medium text-muted-foreground">Fetching VM pricing...</span>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">Simulating run-rate...</span>
                </div>
            </div>
        );
    }

    if (!estimate || estimate.available === false) {
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

    const hourlyRate = estimate.estimated_cost_hourly || 0.00;
    const monthlyRate = estimate.estimated_cost_monthly || 0.00;
    const bootDiskCost = estimate.breakdown?.boot_disk_monthly || 0.00;
    const computeCost = estimate.breakdown?.compute_monthly || 0.00;

    const baseComputeMonthly = parseFloat(String(computeCost));
    const baseDiskMonthly = parseFloat(String(bootDiskCost));

    const computeHourlyRate = baseComputeMonthly / 730.0;
    const diskHourlyRate = baseDiskMonthly / 730.0;
    const combinedHourlyRate = computeHourlyRate + diskHourlyRate;

    const finalRunRate = combinedHourlyRate * runtimeHours;

    const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Estimate Details */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Pricing Estimate</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-700 tracking-tight">{formatCurrency(monthlyRate)}</span>
                        <span className="text-xs font-bold text-emerald-500 uppercase">/ month</span>
                    </div>

                    <div className="border-t border-emerald-100 pt-3 space-y-2">
                        <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                            <span>Base Hourly Rate</span>
                            <span>{formatCurrency(hourlyRate)}/hr</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-600">
                            <span>Compute Core ({machineType})</span>
                            <span>{formatCurrency(computeCost)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-600">
                            <span>Boot Disk Cost ({bootDiskSizeGb} GB, {bootDiskType})</span>
                            <span>+{formatCurrency(bootDiskCost)}</span>
                        </div>
                    </div>

                    {estimate.sku_description && (
                        <div className="text-[10px] text-emerald-600 bg-emerald-100/60 px-2 py-1.5 rounded border border-emerald-200 font-mono">
                            <span className="font-semibold">Matched SKU:</span> {estimate.sku_description}
                        </div>
                    )}
                </div>

                {/* Right Card: Simulation runtime tabs */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-blue-100 flex items-center justify-center">
                            <Calculator className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-blue-700">Usage Run-Rate</span>
                    </div>

                    <div className="flex gap-1.5">
                        {RUNTIME_TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                type="button"
                                onClick={() => setRuntimeHours(tier.id)}
                                className={`flex-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                    runtimeHours === tier.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-blue-100/60 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                                {tier.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-700 tracking-tight">{formatCurrency(finalRunRate)}</span>
                        <span className="text-xs font-bold text-blue-500 uppercase">/ month</span>
                    </div>

                    <p className="text-[11px] text-blue-600 font-medium">
                        Projected cost for {runtimeHours} active execution hours + constant disk capacity.
                    </p>
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
                    <li>Network egress and IP address costs are not included</li>
                    <li>Actual billing may vary based on usage patterns</li>
                </ul>
            </div>
        </div>
    );
};

export const VMCostingStep = ({ form }: { form: UseFormReturn<any> }) => {
    const machineType = form.watch('machine_type');
    const zone = form.watch('zone');
    const bootDiskSizeGb = form.watch('boot_disk_size_gb') || 10;
    const bootDiskType = form.watch('boot_disk_type') || 'pd-balanced';

    const showEstimation = !!machineType && !!zone;

    return (
        <div className="space-y-6">
            {!showEstimation && (
                <div className="flex items-start gap-3 p-4 border border-amber-200 rounded-lg bg-amber-50/50 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-700">Configuration Required</p>
                        <p className="text-xs text-amber-600 mt-1">Complete the configuration step to see cost estimates.</p>
                    </div>
                </div>
            )}

            {showEstimation && (
                <VMDualCardEstimate
                    machineType={machineType}
                    zone={zone}
                    bootDiskSizeGb={bootDiskSizeGb}
                    bootDiskType={bootDiskType}
                />
            )}
        </div>
    );
};

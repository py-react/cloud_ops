import React, { useEffect, useState, useRef } from 'react';
import { DollarSign, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { getAuthToken } from '@/libs/auth';
import { cn } from '@/libs/utils';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { GCPErrorBanner, GCPError } from '@/components/GCPErrorBanner';

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

interface CostEstimateWidgetProps {
    params: CostEstimateParams;
    className?: string;
    onLoadingChange?: (loading: boolean) => void;
}

function buildQuery(params: CostEstimateParams): string {
    const q = new URLSearchParams({ resource_type: params.resource_type });
    if (params.storage_class) q.set('storage_class', params.storage_class);
    if (params.size_gb !== undefined) q.set('size_gb', String(params.size_gb));
    if (params.location) q.set('location', params.location);
    if (params.disk_type) q.set('disk_type', params.disk_type);
    if (params.zone) q.set('zone', params.zone);
    if (params.machine_type) q.set('machine_type', params.machine_type);
    if (params.tier) q.set('tier', params.tier);
    if (params.autoclass_enabled !== undefined) q.set('autoclass_enabled', String(params.autoclass_enabled));
    if (params.versioning_enabled !== undefined) q.set('versioning_enabled', String(params.versioning_enabled));
    if (params.soft_delete_days !== undefined) q.set('soft_delete_days', String(params.soft_delete_days));
    if (params.encryption_kms_key) q.set('encryption_kms_key', params.encryption_kms_key);
    if (params.hierarchical_namespace_enabled !== undefined) q.set('hierarchical_namespace_enabled', String(params.hierarchical_namespace_enabled));
    return q.toString();
}

function isParamsSufficient(params: CostEstimateParams): boolean {
    if (params.resource_type === 'bucket') return !!params.storage_class && !!params.location;
    if (params.resource_type === 'disk') return !!params.disk_type && !!params.zone && (params.size_gb ?? 0) > 0;
    if (params.resource_type === 'filestore') return !!params.zone && (params.size_gb ?? 0) >= 1024;
    if (params.resource_type === 'vm') return !!params.machine_type;
    return false;
}

export function CostEstimateWidget({ params, className, onLoadingChange }: CostEstimateWidgetProps) {
    const { selectedGcpCredential } = useGCP();
    const [estimate, setEstimate] = useState<EstimateResult | null>(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>('');

    const hasCredential = !!selectedGcpCredential;

    useEffect(() => {
        if (!isParamsSufficient(params) || !selectedGcpCredential || !hasCredential) {
            setEstimate(null);
            return;
        }

        const query = buildQuery(params);
        if (query === lastQueryRef.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            lastQueryRef.current = query;
            setLoading(true);
            onLoadingChange?.(true);
            
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
                onLoadingChange?.(false);
            }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [params, onLoadingChange, selectedGcpCredential]);

    if (loading) {
        return (
            <div className={cn("rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center gap-3", className)}>
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Fetching pricing from GCP...</span>
            </div>
        );
    }

    if (!hasCredential) {
        return (
            <div className={cn("rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-start gap-2", className)}>
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Select GCP Credential</p>
                    <p className="text-xs text-amber-600">Add a GCP Service Account in the Credential Hub to enable pricing.</p>
                </div>
            </div>
        );
    }

    if (estimate && !estimate.available) {
        const gcpError = estimate as GCPError;
        if (gcpError.error_type) {
            return (
                <div className={className}>
                    <GCPErrorBanner error={gcpError} onRetry={() => {}} />
                </div>
            );
        }
        return (
            <div className={cn("rounded-lg border border-red-200 bg-red-50/50 p-3 flex items-start gap-2", className)}>
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700">Estimate Unavailable</p>
                    <p className="text-xs text-red-600">{estimate.reason}</p>
                </div>
            </div>
        );
    }

    if (!estimate || (params.size_gb ?? 0) === 0) {
        return (
            <div className={cn("rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center justify-center", className)}>
                <span className="text-lg font-bold text-muted-foreground">$0.00</span>
            </div>
        );
    }

    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: estimate.currency || 'USD', minimumFractionDigits: 2 }).format(estimate.monthly_estimate || 0);
    const perGb = estimate.per_gb_price
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(estimate.per_gb_price)
        : null;

    const hasSurcharges = estimate.breakdown && Object.keys(estimate.breakdown.surcharges).length > 0;

    return (
        <div className={cn("rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3", className)}>
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Estimated Monthly Cost</span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 tracking-tight">{formatted}</span>
                <span className="text-xs font-bold text-emerald-500 uppercase">/ month</span>
            </div>

            {perGb && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{perGb} per GB</span>
                </div>
            )}

            {hasSurcharges && estimate.breakdown && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                    <div className="flex justify-between text-xs text-emerald-600">
                        <span>Base Storage</span>
                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimate.breakdown.base_storage)}</span>
                    </div>
                    {Object.entries(estimate.breakdown.surcharges).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs text-emerald-600">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <span>+{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {estimate.sku_description && (
                <div className="text-[10px] text-emerald-600 bg-emerald-100/60 px-2 py-1.5 rounded border border-emerald-200">
                    <span className="font-semibold">Matched SKU:</span> {estimate.sku_description}
                </div>
            )}

            <p className="text-[9px] text-emerald-500 leading-relaxed border-t border-emerald-100 pt-2">
                Estimates are based on current GCP list prices fetched via the Cloud Billing SDK.
            </p>
        </div>
    );
}

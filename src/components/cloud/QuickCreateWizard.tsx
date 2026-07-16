import React, { useState, useEffect, useRef } from 'react';
import * as z from 'zod';
import { Cloud, Database, Cpu } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { DefaultService } from '@/gingerJs_api_client/services/DefaultService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
    provider: z.enum(['GCP', 'AWS']),
    zone: z.string().min(1, 'Zone/Region is required'),
    plan: z.string().min(1, 'Plan is required'),
    image: z.string().min(1, 'OS image is required'),
    imageKey: z.string().optional(),
    minDiskGb: z.number().optional(),
    instanceName: z.string().min(1, 'Instance name is required'),
    gcpImageUri: z.string().optional(),
    awsImageId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type VocabData = {
    locations: { id: string; label: string; gcp?: string; aws?: string }[];
    plans: { id: string; label: string; desc: string; gcp?: string; aws?: string; freeTier?: boolean }[];
    os: { id: string; label: string; os_family: string; min_disk_gb: number; key: string; gcp?: string; aws?: string }[];
    disks: { id: string; label: string; gcp?: string; gcp_size?: number; aws?: string; aws_size?: number }[];
    defaults?: { disk_id?: string };
};

const PROVIDER_LABELS: Record<string, string> = { GCP: 'Google Cloud Platform', AWS: 'Amazon Web Services' };

const providerBadge = (supportsGcp: boolean, supportsAws: boolean) => {
    if (supportsGcp && supportsAws) {
        return <span className="bg-gray-100 text-gray-500 text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wider ml-1.5">All providers</span>;
    }
    if (supportsGcp) {
        return <span className="bg-blue-100 text-blue-600 text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wider ml-1.5">GCP</span>;
    }
    if (supportsAws) {
        return <span className="bg-amber-100 text-amber-600 text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wider ml-1.5">AWS</span>;
    }
    return null;
};

interface ReviewStepProps {
    watch: any;
    setValue: any;
    gcpCredentialId?: number | string;
    awsCredentialId?: number | string;
    gcpCredentials: { id: number; name: string }[];
    awsCredentials: { id: number; name: string }[];
    onSelectGcpCredential: (id: number) => void;
    onSelectAwsCredential: (id: number) => void;
    projectId: string;
    vocab: VocabData;
}

const ReviewStep = ({ watch, setValue, gcpCredentialId, awsCredentialId, gcpCredentials, awsCredentials, onSelectGcpCredential, onSelectAwsCredential, projectId, vocab }: ReviewStepProps) => {
    const provider = watch('provider');
    const zone = watch('zone');
    const plan = watch('plan');
    const image = watch('image');
    const instanceName = watch('instanceName');
    const awsImageId = watch('awsImageId');
    const [gcpPrice, setGcpPrice] = useState<{ hourly: number; monthly: number; compute: number; disk: number } | null>(null);
    const [awsPrice, setAwsPrice] = useState<{ hourly: number; monthly: number; compute: number; disk: number } | null>(null);
    const [gcpLoading, setGcpLoading] = useState(false);
    const [awsLoading, setAwsLoading] = useState(false);

    const gcpZone = vocab.locations.find(l => l.id === zone)?.gcp ?? null;
    const awsRegion = vocab.locations.find(l => l.id === zone)?.aws ?? null;
    const gcpInstanceType = vocab.plans.find(p => p.id === plan)?.gcp ?? null;
    const pObj = vocab.plans.find(p => p.id === plan);
    const awsInstanceType = pObj
        ? (awsRegion && pObj.aws_by_region && pObj.aws_by_region[awsRegion]
            ? pObj.aws_by_region[awsRegion]
            : pObj.aws)
        : null;
    const gcpOsUri = vocab.os.find(o => o.id === image)?.gcp ?? null;
    const locationLabel = vocab.locations.find(l => l.id === zone)?.label || zone;
    const planLabel = pObj ? `${pObj.label} — ${pObj.desc}` : plan;

    const gcpSupported = !!gcpZone && !!gcpInstanceType && !!gcpOsUri;
    const awsSupported = !!awsRegion && !!awsInstanceType && !!awsImageId;

    useEffect(() => {
        if (!provider || !zone) return;
        const loc = vocab.locations.find(l => l.id === zone);
        if (!loc) return;
        const issues: string[] = [];
        if (provider === 'GCP') {
            if (!gcpZone && loc.label) issues.push(`${loc.label} is not available on GCP`);
            if (gcpZone && !gcpInstanceType && plan) issues.push(`The selected plan is not available on GCP`);
            if (gcpZone && gcpInstanceType && !gcpOsUri && image) issues.push(`The selected OS is not available on GCP`);
        } else {
            if (!awsRegion && loc.label) issues.push(`${loc.label} is not available on AWS`);
            if (awsRegion && !awsInstanceType && plan) issues.push(`The selected plan is not available on AWS`);
            if (awsRegion && awsInstanceType && !awsImageId && image) issues.push(`The selected OS is not available on AWS`);
        }
        if (issues.length > 0) toast.warning(issues.join('. '));
    }, [provider]);

    useEffect(() => {
        if (!plan || !zone || !gcpZone || !gcpInstanceType || !gcpOsUri) return;
        if (!gcpCredentialId || !projectId) { setGcpPrice(null); return; }
        let cancelled = false;
        setGcpLoading(true);
        DefaultService.apiV1PricingEstimateGet({
            credentialId: String(gcpCredentialId),
            resourceType: 'vm',
            machineType: gcpInstanceType,
            zone: gcpZone,
            sizeGb: 10,
            diskType: 'pd-balanced',
        }).then((res: any) => {
            if (!cancelled && res?.estimated_cost_monthly != null) {
                const bd = res?.breakdown || {};
                setGcpPrice({
                    hourly: res.estimated_cost_hourly || res.estimated_cost_monthly / 730,
                    monthly: res.estimated_cost_monthly,
                    compute: bd.compute_monthly || 0,
                    disk: bd.boot_disk_monthly || 0,
                });
            }
        }).catch(() => {}).finally(() => { if (!cancelled) setGcpLoading(false); });
        return () => { cancelled = true; };
    }, [plan, zone, gcpZone, gcpInstanceType, gcpOsUri, gcpCredentialId, projectId]);

    useEffect(() => {
        if (!plan || !awsRegion || !awsInstanceType || !awsImageId) return;
        if (!awsCredentialId) { setAwsPrice(null); return; }
        let cancelled = false;
        setAwsLoading(true);
        DefaultService.apiV1AwsPricingEstimateGet({
            credentialId: String(awsCredentialId),
            resourceType: 'ec2_instance',
            instanceType: awsInstanceType,
            region: awsRegion,
            volumeSize: 10,
            volumeType: 'gp3',
        }).then((res: any) => {
            if (!cancelled && res?.estimated_cost_monthly != null) {
                const bd = res?.breakdown || {};
                setAwsPrice({
                    hourly: res.estimated_cost_hourly || res.estimated_cost_monthly / 730,
                    monthly: res.estimated_cost_monthly,
                    compute: bd.compute_monthly || 0,
                    disk: bd.ebs_monthly || 0,
                });
            }
        }).catch(() => {}).finally(() => { if (!cancelled) setAwsLoading(false); });
        return () => { cancelled = true; };
    }, [plan, awsRegion, awsInstanceType, awsImageId, awsCredentialId]);

    const selectedIsGcp = provider === 'GCP';

    const priceCell = (supported: boolean, loading: boolean, price: { hourly: number; monthly: number; compute: number; disk: number } | null) => {
        if (!supported) return <span className="text-red-400 text-xs font-medium">N/A</span>;
        if (loading) return <Loader2 className="w-3 h-3 animate-spin inline" />;
        return price ? `$${price.hourly.toFixed(2)}` : '—';
    };

    const monthlyCell = (supported: boolean, loading: boolean, price: { hourly: number; monthly: number; compute: number; disk: number } | null) => {
        if (!supported) return <span className="text-red-400 text-xs font-medium">N/A</span>;
        if (loading) return <Loader2 className="w-3 h-3 animate-spin inline" />;
        if (!price) return '—';
        return `$${price.monthly.toFixed(2)}`;
    };

    return (
        <div className="py-4 space-y-5">
            {(provider === 'GCP' ? !gcpSupported : !awsSupported) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
                    <strong>Not available:</strong> Some selections are not available on{' '}
                    {PROVIDER_LABELS[provider]}. Pricing shows <strong>N/A</strong> for any unsupported
                    option.
                </div>
            )}

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Cloud Provider</Label>
                <Select value={provider} onValueChange={v => setValue('provider', v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GCP">
                            <span className="flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-blue-500" />
                                Google Cloud Platform
                            </span>
                        </SelectItem>
                        <SelectItem value="AWS">
                            <span className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-amber-500" />
                                Amazon Web Services
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {provider === 'GCP' && (
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">GCP Credential</Label>
                    <Select
                        value={String(gcpCredentialId ?? '')}
                        onValueChange={v => onSelectGcpCredential(Number(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a GCP credential" />
                        </SelectTrigger>
                        <SelectContent>
                            {gcpCredentials.map((cred: any) => (
                                <SelectItem key={cred.id} value={String(cred.id)}>{cred.name}</SelectItem>
                            ))}
                            {gcpCredentials.length === 0 && (
                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">No credentials available</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {provider === 'AWS' && (
                <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">AWS Credential</Label>
                    <Select
                        value={String(awsCredentialId ?? '')}
                        onValueChange={v => onSelectAwsCredential(Number(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an AWS credential" />
                        </SelectTrigger>
                        <SelectContent>
                            {awsCredentials.map((cred: any) => (
                                <SelectItem key={cred.id} value={String(cred.id)}>{cred.name}</SelectItem>
                            ))}
                            {awsCredentials.length === 0 && (
                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">No credentials available</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Configuration</Label>
                <div className="rounded-lg border divide-y">
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-muted-foreground">Provider</span>
                        <span className="text-sm font-semibold">{PROVIDER_LABELS[provider] || provider}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="text-sm font-semibold">{locationLabel}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <span className="text-sm font-semibold">{planLabel}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-muted-foreground">Instance Name</span>
                        <span className="text-sm font-semibold font-mono">{instanceName}</span>
                    </div>
                </div>
            </div>

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Cost Comparison (live pricing)</Label>
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hourly</th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly (730h)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr className={`${selectedIsGcp ? 'bg-blue-50/60 font-semibold' : ''} transition-colors`}>
                                <td className="px-4 py-2.5 flex items-center gap-2">
                                    {selectedIsGcp && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                                    <span>Google Cloud</span>
                                    {selectedIsGcp && <span className="text-[10px] font-bold text-blue-600 uppercase ml-1">Selected</span>}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">{priceCell(gcpSupported, gcpLoading, gcpPrice)}/hr</td>
                                <td className="px-4 py-2.5 text-right font-semibold">{monthlyCell(gcpSupported, gcpLoading, gcpPrice)}</td>
                            </tr>
                            {gcpPrice && gcpSupported && (
                                <tr className="text-[11px] text-muted-foreground">
                                    <td className="px-4 py-1" colSpan={3}>
                                        <span className="ml-5">Compute: ${gcpPrice.compute.toFixed(2)} /mo</span>
                                        <span className="ml-3">Disk: ${gcpPrice.disk.toFixed(2)} /mo</span>
                                    </td>
                                </tr>
                            )}
                            <tr className={`${!selectedIsGcp ? 'bg-amber-50/60 font-semibold' : ''} transition-colors`}>
                                <td className="px-4 py-2.5 flex items-center gap-2">
                                    {!selectedIsGcp && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                                    <span>AWS</span>
                                    {!selectedIsGcp && <span className="text-[10px] font-bold text-amber-600 uppercase ml-1">Selected</span>}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">{priceCell(awsSupported, awsLoading, awsPrice)}/hr</td>
                                <td className="px-4 py-2.5 text-right font-semibold">{monthlyCell(awsSupported, awsLoading, awsPrice)}</td>
                            </tr>
                            {awsPrice && awsSupported && (
                                <tr className="text-[11px] text-muted-foreground">
                                    <td className="px-4 py-1" colSpan={3}>
                                        <span className="ml-5">Compute: ${awsPrice.compute.toFixed(2)} /mo</span>
                                        <span className="ml-3">Disk: ${awsPrice.disk.toFixed(2)} /mo</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Live on-demand rates via cloud provider APIs. Actual billing may vary.</p>
            </div>
        </div>
    );
};

const QuickConfigStep = ({ form, watch, setValue, gcpCredentialId, awsCredentialId, projectId, vocab }: any) => {
    const selectedZone = watch('zone');
    const selectedPlan = watch('plan');
    const selectedImage = watch('image');
    const instanceName = watch('instanceName');

    useEffect(() => {
        setDefaultOS();
        if (!watch('plan')) setValue('plan', vocab.plans?.[0]?.id || '');
    }, [vocab]);

    const setDefaultOS = () => {
        if (!watch('image') && vocab.os?.length > 0) {
            const first = vocab.os[0];
            setValue('image', first.id);
            setValue('imageKey', first.key);
            setValue('minDiskGb', first.min_disk_gb);
            setValue('gcpImageUri', first.gcp ?? '');
            setValue('awsImageId', first.aws ?? '');
        }
    };

    const handleOSChange = (osId: string) => {
        const entry = vocab.os?.find((o: any) => o.id === osId);
        if (!entry) return;
        setValue('image', osId);
        setValue('imageKey', entry.key);
        setValue('minDiskGb', entry.min_disk_gb);
        setValue('gcpImageUri', entry.gcp ?? '');
        setValue('awsImageId', entry.aws ?? '');
    };

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Location</Label>
                <Select value={selectedZone} onValueChange={v => setValue('zone', v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                        {vocab.locations?.map((loc: any) => (
                            <SelectItem key={loc.id} value={loc.id}>
                                <span className="flex items-center gap-1">
                                    <span>{loc.label}</span>
                                    {providerBadge(!!loc.gcp, !!loc.aws)}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Plan (CPU · RAM)</Label>
                <Select value={selectedPlan} onValueChange={v => setValue('plan', v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                        {vocab.plans?.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                                <span className="flex items-center gap-2">
                                    <span>{p.label}</span>
                                    <span className="text-muted-foreground text-xs">— {p.desc}</span>
                                    {p.freeTier && (
                                        <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ml-2">FREE</span>
                                    )}
                                    {providerBadge(!!p.gcp, !!p.aws)}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Operating System</Label>
                <Select value={selectedImage} onValueChange={handleOSChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an OS" />
                    </SelectTrigger>
                    <SelectContent>
                        {vocab.os?.map((os: any) => (
                            <SelectItem key={os.id} value={os.id}>
                                <span className="flex items-center gap-1">
                                    <span>{os.label}</span>
                                    {providerBadge(!!os.gcp, !!os.aws)}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Instance Name</Label>
                <Input
                    value={instanceName || ''}
                    onChange={e => setValue('instanceName', e.target.value)}
                    placeholder="my-instance"
                    className="h-9"
                />
            </div>
        </div>
    );
    };

interface QuickCreateWizardProps {
    projectId: string;
    gcpCredentialId?: number | string;
    awsCredentialId?: number | string;
    gcpCredentials: { id: number; name: string }[];
    awsCredentials: { id: number; name: string }[];
    onSelectGcpCredential: (id: number) => void;
    onSelectAwsCredential: (id: number) => void;
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;
    onSubmit: (data: FormValues) => Promise<void>;
}

export function QuickCreateWizard({ projectId, gcpCredentialId, awsCredentialId, gcpCredentials, awsCredentials, onSelectGcpCredential, onSelectAwsCredential, isWizardOpen, setIsWizardOpen, onSubmit }: QuickCreateWizardProps) {
    const [activeStep, setActiveStep] = useState('config');
    const vocabRef = useRef<VocabData>({ locations: [], plans: [], os: [], disks: [] });
    const [vocabReady, setVocabReady] = useState(false);

    useEffect(() => {
        DefaultService.apiV1VocabGet().then((data: any) => {
            vocabRef.current = data;
            setVocabReady(true);
        }).catch(() => {
            setVocabReady(true);
        });
    }, []);

    const getLoc = (provider: string, locationId: string): string | null => {
        const loc = vocabRef.current.locations.find(l => l.id === locationId);
        if (!loc) return null;
        return provider === 'GCP' ? (loc.gcp ?? null) : (loc.aws ?? null);
    };
    const getPlan = (provider: string, planId: string, region?: string | null): string | null => {
        const p = vocabRef.current.plans.find(x => x.id === planId);
        if (!p) return null;
        if (provider === 'GCP') return p.gcp ?? null;
        if (region && p.aws_by_region && p.aws_by_region[region]) return p.aws_by_region[region];
        return p.aws ?? null;
    };

    const steps = [
        {
            id: 'config',
            label: 'Configuration',
            icon: Cpu,
            description: 'Plan, OS, and name',
            longDescription: 'Pick a preset plan, choose an operating system, and name your instance.',
            component: QuickConfigStep,
            props: { gcpCredentialId, awsCredentialId, projectId, vocab: vocabRef.current },
            canNavigateNext: (form: any) => {
                const img = form.watch('image');
                const name = form.watch('instanceName');
                return {
                    can: !!img && !!name?.trim(),
                    message: 'Please select an OS image and enter an instance name.',
                };
            },
        },
        {
            id: 'review',
            label: 'Review',
            icon: Cloud,
            description: 'Provider and cost',
            longDescription: 'Choose a provider, review your selections, and compare live pricing.',
            component: ReviewStep,
            props: { gcpCredentialId, awsCredentialId, gcpCredentials, awsCredentials, onSelectGcpCredential, onSelectAwsCredential, projectId, vocab: vocabRef.current },
            canNavigateNext: (form: any) => {
                const provider = form.watch('provider');
                const zone = form.watch('zone');
                const plan = form.watch('plan');
                const image = form.watch('image');
                const awsImageId = form.watch('awsImageId');
                if (!provider) return { can: false, message: 'Please select a provider.' };
                const gcpZone = getLoc('GCP', zone);
                const awsRegion = getLoc('AWS', zone);
                const gcpInstanceType = getPlan('GCP', plan);
                const awsInstanceType = getPlan('AWS', plan, awsRegion);
                const gcpOsUri = vocabRef.current.os.find((o: any) => o.id === image)?.gcp;
                if (provider === 'GCP' && (!gcpZone || !gcpInstanceType || !gcpOsUri)) {
                    return { can: false, message: 'Selected configuration is not available on GCP.' };
                }
                if (provider === 'AWS' && (!awsRegion || !awsInstanceType || !awsImageId)) {
                    return { can: false, message: 'Selected configuration is not available on AWS.' };
                }
                return { can: true };
            },
        },
    ];

    const initialValues: FormValues = {
        provider: 'GCP',
        zone: '',
        plan: 'micro',
        image: '',
        imageKey: '',
        minDiskGb: 10,
        instanceName: '',
        gcpImageUri: '',
        awsImageId: '',
    };

    return (
        <FormWizard
            name="quick-create-wizard"
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
            currentStep={activeStep}
            setCurrentStep={setActiveStep}
            steps={steps}
            schema={schema}
            initialValues={initialValues}
            onSubmit={onSubmit}
            submitLabel="Create Instance"
            submitIcon={Cpu}
            heading={{
                primary: 'Quick Create Virtual Machine',
                secondary: 'Choose a provider, pick a preset plan, and we\'ll handle the rest.',
                icon: Cpu,
            }}
        />
    );
}

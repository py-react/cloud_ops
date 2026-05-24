import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Globe, Cpu, Network, Tags, Plus, Trash2, Loader2, ShieldAlert, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';

interface SgRule {
    direction: 'ingress' | 'egress';
    protocol: string;
    from_port: number;
    to_port: number;
    cidr: string;
    description: string;
}

interface SelectOption {
    value: string;
    label: string;
    free_tier_eligible?: boolean;
    description?: string;
}

export const BasicStep = ({ regions, onRegionChange }: { regions: SelectOption[]; onRegionChange: (region: string) => void }) => {
    const { control } = useFormContext();

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="instance_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instance Name</FormLabel>
                        <FormControl>
                            <Input placeholder="my-web-server" className="font-mono" {...field} />
                        </FormControl>
                        <FormDescription>A descriptive name for your EC2 instance. A random suffix will be appended.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="region"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> AWS Region</FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); onRegionChange(v); }} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {regions.map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose the AWS region where your instance will be launched.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export const ConfigurationStep = ({ instanceTypes, images, metaLoading, credId }: { instanceTypes: SelectOption[]; images: any[]; metaLoading: boolean; credId?: number }) => {
    const { control, watch } = useFormContext();
    const region = watch('region');

    const grouped = images.reduce((acc: Record<string, any[]>, img: any) => {
        const family = img.os_family || 'Other';
        if (!acc[family]) acc[family] = [];
        acc[family].push(img);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="image_id"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Operating System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    {metaLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                    <SelectValue placeholder="Select an OS" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50 max-h-72">
                                <SelectItem value="__latest__" className="font-bold" key="__latest__">Auto-resolve (latest Amazon Linux 2023)</SelectItem>
                                {Object.entries(grouped).map(([family, imgs]) => (
                                    <SelectGroup key={family}>
                                        <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{family}</SelectLabel>
                                        {imgs.map((img: any, idx: number) => (
                                            <SelectItem key={img.image_id || idx} value={img.os_family && img.os_family !== 'Custom' ? img.os_family : img.image_id} className="pl-4">
                                                <span className="font-medium">{img.image_id}</span>
                                                <span className="text-muted-foreground ml-2 text-[11px]">{img.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose an OS or leave as auto-resolve for the latest Amazon Linux 2023.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="instance_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instance Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    {metaLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                    <SelectValue placeholder="Select instance type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {metaLoading ? (
                                    <div className="p-3 text-center text-xs text-muted-foreground">Loading...</div>
                                ) : instanceTypes.length === 0 ? (
                                    <SelectItem value="t2.micro">t2.micro</SelectItem>
                                ) : (
                                    [...instanceTypes]
                                        .sort((a, b) => (b.free_tier_eligible ? 1 : 0) - (a.free_tier_eligible ? 1 : 0))
                                        .map(t => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                                {t.free_tier_eligible ? ' 🆓 FREE' : ''}
                                            </SelectItem>
                                        ))
                                )}
                            </SelectContent>
                        </Select>
                        {instanceTypes.some(t => t.free_tier_eligible) && (
                            <p className="text-[10px] text-emerald-600 font-medium mt-1">🆓 Free tier eligible types marked in list</p>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="key_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Key Pair (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="my-key-pair" className="font-mono" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Name of an existing EC2 key pair for SSH access.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

type PresetKey = 'web' | 'ssh' | 'https' | 'custom';

const PRESETS: { key: PresetKey; label: string; description: string; rules: SgRule[] }[] = [
    { key: 'web', label: '🌐 Web Server', description: 'Opens HTTP (80) and HTTPS (443) to everyone',
        rules: [
            { direction: 'ingress', protocol: 'tcp', from_port: 80, to_port: 80, cidr: '0.0.0.0/0', description: 'HTTP' },
            { direction: 'ingress', protocol: 'tcp', from_port: 443, to_port: 443, cidr: '0.0.0.0/0', description: 'HTTPS' },
        ]
    },
    { key: 'ssh', label: '🔑 SSH Access', description: 'Opens SSH (22) to a specific IP',
        rules: [
            { direction: 'ingress', protocol: 'tcp', from_port: 22, to_port: 22, cidr: '0.0.0.0/0', description: 'SSH' },
        ]
    },
    { key: 'https', label: '🔒 HTTPS Only', description: 'Only HTTPS (443) — no HTTP',
        rules: [
            { direction: 'ingress', protocol: 'tcp', from_port: 443, to_port: 443, cidr: '0.0.0.0/0', description: 'HTTPS' },
        ]
    },
    { key: 'custom', label: '✏️ Custom Port', description: 'Open a specific port',
        rules: []  // filled dynamically
    },
];

function SgRuleEditor({ rules, onChange }: { rules: SgRule[]; onChange: (r: SgRule[]) => void }) {
    const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);
    const [customPort, setCustomPort] = useState('3000');
    const [customLabel, setCustomLabel] = useState('');

    const applyPreset = (key: PresetKey) => {
        setSelectedPreset(key);
        if (key === 'custom') return;
        const preset = PRESETS.find(p => p.key === key);
        if (preset) onChange([...rules, ...preset.rules]);
    };

    const applyCustom = () => {
        const port = parseInt(customPort);
        if (!port || port < 1 || port > 65535) return;
        onChange([...rules, {
            direction: 'ingress',
            protocol: 'tcp',
            from_port: port,
            to_port: port,
            cidr: '0.0.0.0/0',
            description: customLabel || `Port ${port}`,
        }]);
        setCustomPort('3000');
        setCustomLabel('');
    };

    const removeRule = (i: number) => onChange(rules.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            {rules.length > 0 && (
                <div className="space-y-1.5">
                    {rules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-background rounded-md px-3 py-1.5 border">
                            <Badge variant="default" className="text-[9px] uppercase">In</Badge>
                            <span className="font-mono font-bold">Port {rule.from_port}{rule.from_port !== rule.to_port ? `–${rule.to_port}` : ''}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono">{rule.cidr === '0.0.0.0/0' ? 'Everyone' : rule.cidr}</span>
                            {rule.description && <span className="text-muted-foreground truncate max-w-24">{rule.description}</span>}
                            <button type="button" onClick={() => removeRule(i)} className="ml-auto text-red-500 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick presets</p>
            <div className="flex flex-wrap gap-2">
                {PRESETS.filter(p => p.key !== 'custom').map(p => (
                    <Button key={p.key} type="button" variant="outline" size="sm" className="text-xs"
                        onClick={() => applyPreset(p.key)} title={p.description}>
                        {p.label}
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <Input type="number" min={1} max={65535} placeholder="Port number" className="h-8 text-xs font-mono w-28"
                    value={customPort} onChange={e => setCustomPort(e.target.value)} />
                <Input placeholder="Label (optional)" className="h-8 text-xs flex-1"
                    value={customLabel} onChange={e => setCustomLabel(e.target.value)} />
                <Button type="button" size="sm" className="h-8 text-xs" onClick={applyCustom}>
                    <Plus className="w-3 h-3 mr-1" /> Add Port
                </Button>
            </div>
        </div>
    );
}

function SgRulesSummary({ rules, max }: { rules: any[]; max?: number }) {
    const display = max ? rules.slice(0, max) : rules;
    return (
        <div className="space-y-0.5">
            {display.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-muted-foreground uppercase text-[9px] font-bold">{r.protocol === '-1' ? 'ALL' : r.protocol}</span>
                    {r.from_port !== undefined && (
                        <span>
                            :{r.from_port}{r.from_port !== r.to_port ? `–${r.to_port}` : ''}
                        </span>
                    )}
                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                    <span>{r.cidr === '0.0.0.0/0' ? 'Everyone' : r.cidr}</span>
                    {r.description && <span className="text-muted-foreground truncate max-w-24">— {r.description}</span>}
                </div>
            ))}
            {max && rules.length > max && (
                <div className="text-[10px] text-muted-foreground italic">+{rules.length - max} more rules</div>
            )}
        </div>
    );
}

export const NetworkStep = ({ securityGroups, zones, metaLoading, credId, onSgCreated }: { securityGroups: SelectOption[]; zones: SelectOption[]; metaLoading: boolean; credId?: number; onSgCreated?: (sg: SelectOption) => void }) => {
    const { control, watch, setValue } = useFormContext();
    const region = watch('region');
    const [showCreateSg, setShowCreateSg] = useState(false);
    const [newSgName, setNewSgName] = useState('');
    const [sgRules, setSgRules] = useState<SgRule[]>([]);
    const [creatingSg, setCreatingSg] = useState(false);

    const handleCreateSg = async () => {
        if (!newSgName.trim() || !credId) return;
        setCreatingSg(true);
        const token = getAuthToken();
        const ingressRules = sgRules.filter(r => r.direction === 'ingress').map(({ direction, ...rest }) => rest);
        const egressRules = sgRules.filter(r => r.direction === 'egress').map(({ direction, ...rest }) => rest);
        try {
            const res = await fetch(`/api/v1/aws/compute/meta?credential_id=${credId}&region=${region}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    action: 'create_security_group',
                    group_name: newSgName.trim(),
                    ingress_rules: ingressRules,
                    egress_rules: egressRules,
                }),
            });
            const data = await res.json();
            if (data.status === 'error') { toast.error(data.message); return; }
            const sgId = data.group_id;
            const newSg: SelectOption = {
                value: sgId,
                label: `${newSgName.trim()} (${sgId})`,
                description: data.message || '',
                ingress: ingressRules.map(r => ({ protocol: 'tcp', from_port: r.from_port, to_port: r.to_port, cidr: r.cidr || '0.0.0.0/0', description: r.description || '' })),
                egress: egressRules.map(r => ({ protocol: 'tcp', from_port: r.from_port, to_port: r.to_port, cidr: r.cidr || '0.0.0.0/0', description: r.description || '' })),
            };
            onSgCreated?.(newSg);
            setValue('security_group_id', sgId);
            toast.success(`Security group "${newSgName}" created and selected`);
            setNewSgName('');
            setSgRules([]);
        } catch { toast.error('Failed to create security group'); }
        finally { setCreatingSg(false); }
    };

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="availability_zone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Network className="w-3 h-3" /> Availability Zone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    {metaLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                    <SelectValue placeholder="Auto (default)" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                <SelectItem value="__auto__">Auto (no preference)</SelectItem>
                                {zones.map(z => (
                                    <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose a specific availability zone or leave as auto.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="subnet_id"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subnet ID (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="subnet-abc123" className="font-mono" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>The subnet to launch the instance into. Leave blank for the default VPC subnet.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="security_group_id"
                render={({ field }) => {
                    const selectedSg = securityGroups.find(s => s.value === field.value);
                    return (
                        <FormItem>
                            <FormLabel>Security Group</FormLabel>
                            {!field.value ? (
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            {metaLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                            <SelectValue placeholder="Choose a security group..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background border-border/50">
                                        {securityGroups.map(sg => (
                                            <SelectItem key={sg.value} value={sg.value}>{sg.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : selectedSg ? (
                                <div className="rounded-lg border bg-card p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                                            {selectedSg.label}
                                        </div>
                                        <button type="button" onClick={() => field.onChange('')}
                                            className="text-xs text-red-500 hover:text-red-700 font-semibold">Change</button>
                                    </div>
                                    {selectedSg.description && (
                                        <p className="text-[10px] text-muted-foreground">{selectedSg.description}</p>
                                    )}
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Inbound</p>
                                            {selectedSg.ingress?.length ? (
                                                <SgRulesSummary rules={selectedSg.ingress} max={4} />
                                            ) : (
                                                <p className="text-[10px] text-muted-foreground italic">No inbound rules</p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Outbound</p>
                                            {selectedSg.egress?.length ? (
                                                <SgRulesSummary rules={selectedSg.egress} max={4} />
                                            ) : (
                                                <p className="text-[10px] text-muted-foreground italic">No outbound rules</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-red-500">Selected security group not found</p>
                            )}
                            <FormDescription>Choose a security group, or create a new one below.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    );
                }}
            />
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={showCreateSg} onCheckedChange={(v) => setShowCreateSg(!!v)} />
                    <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            Create New Security Group
                        </span>
                        <p className="text-[10px] text-muted-foreground">Define a new security group with custom rules instead of selecting existing ones.</p>
                    </div>
                </label>
                {showCreateSg && (
                    <div className="space-y-3 pl-7 border-l-2 border-muted ml-1">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="my-sg-name"
                                className="font-mono text-xs flex-1"
                                value={newSgName}
                                onChange={(e) => setNewSgName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                            />
                        </div>
                        <SgRuleEditor rules={sgRules} onChange={setSgRules} />
                        <div className="flex justify-end">
                            <Button type="button" size="sm" onClick={handleCreateSg} disabled={!newSgName.trim() || creatingSg}>
                                {creatingSg ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                                Create Security Group & Add to Instance
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg border p-4 space-y-3 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Bastion Integration</span>
                </div>
                <FormField
                    control={control}
                    name="bastion_enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-3 space-y-0">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-tight">
                                <FormLabel className="text-sm font-semibold cursor-pointer">Enable Bastion access</FormLabel>
                                <FormDescription className="text-[11px]">
                                    Injects the Bastion SSH key via cloud-init and registers this instance in the Bastion system for web-based SSH access.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

export const TagsStep = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: 'tags' });

    return (
        <div className="space-y-6">
            <FormLabel className="flex items-center gap-1.5"><Tags className="w-3 h-3" /> Tags</FormLabel>
            <p className="text-[11px] text-muted-foreground -mt-4">Optional key-value pairs to organize your instances.</p>
            {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`tags.${i}.key`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Key" className="font-mono text-xs" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`tags.${i}.value`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Value" className="font-mono text-xs" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => remove(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => append({ key: '', value: '' })}>
                <Plus className="w-3 h-3 mr-1" /> Add Tag
            </Button>
        </div>
    );
};

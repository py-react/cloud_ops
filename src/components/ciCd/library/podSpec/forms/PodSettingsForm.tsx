import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DefaultService } from "@/gingerJs_api_client";
import { Shield, Network, Globe, Timer, Link2, Share2, User, List, Tag, Settings2 } from "lucide-react";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

export const PodSettingsForm = ({ control, namespace }: { control: any, namespace: string }) => {
    const [serviceAccounts, setServiceAccounts] = useState<string[]>([]);

    useEffect(() => {
        const fetchSA = async () => {
            try {
                const data = await DefaultService.apiIntegrationKubernetesServiceAccountGet({ namespace });
                setServiceAccounts(data as string[]);
            } catch (error) {
                console.error("Error fetching service accounts:", error);
            } finally {
            }
        };
        fetchSA();
    }, [namespace]);

    const dnsPolicies = [
        { value: "ClusterFirst", label: "ClusterFirst (Normal pods)" },
        { value: "Default", label: "Default (Node's resolv.conf)" },
        { value: "ClusterFirstWithHostNet", label: "ClusterFirstWithHostNet (Use with HostNetwork)" },
        { value: "None", label: "None (Manual DNS via dnsConfig)" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Identity & Governance */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Identity & Governance</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={control}
                        name="service_account_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 opacity-60" /> Service Account
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select service account" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Not Specified</SelectItem>
                                        {serviceAccounts.map((sa) => (
                                            <SelectItem key={sa} value={sa}>{sa}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="dns_policy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> DNS Policy
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select DNS policy" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Not Specified</SelectItem>
                                        {dnsPolicies.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="namespace"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> Namespace <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} value={namespace} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Networking & Discovery */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Network className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Networking & Discovery</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="hostname"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Hostname
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. nginx" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="subdomain"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Subdomain
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. web" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Termination & Lifecycle */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Termination & Lifecycle</h3>
                </div>

                <FormField
                    control={control}
                    name="termination_grace_period_seconds"
                    render={({ field }) => (
                        <FormItem className="space-y-4 px-1">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                    Termination Grace Period
                                </FormLabel>
                                <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                    {field.value || 30}s
                                </span>
                            </div>
                            <FormControl>
                                <Slider
                                    min={0}
                                    max={3600}
                                    step={1}
                                    value={[field.value || 30]}
                                    onValueChange={(vals: number[]) => field.onChange(vals[0])}
                                />
                            </FormControl>
                            <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">
                                Duration in seconds the pod needs to terminate gracefully.
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            {/* Advanced Flags */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Advanced Flags</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                        control={control}
                        name="automount_service_account_token"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Auto-mount SA Token</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">Mount default token</FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value === true}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="host_network"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Host Network</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">Use host namespace</FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value || false}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="enable_service_links"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Service Links</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">Inject env vars</FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value || false}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="share_process_namespace"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Share Process NS</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">Visible processes</FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value || false}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

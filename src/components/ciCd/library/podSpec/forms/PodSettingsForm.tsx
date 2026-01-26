import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DefaultService } from "@/gingerJs_api_client";
import { Shield, Network, Globe, Timer, Link2, Share2, User } from "lucide-react";

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
        <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Account */}
                <FormField
                    control={control}
                    name="service_account_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Service Account
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

                {/* DNS Policy */}
                <FormField
                    control={control}
                    name="dns_policy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                DNS Policy
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

                {/* Hostname */}
                <FormField
                    control={control}
                    name="hostname"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hostname</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. nginx" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Subdomain */}
                <FormField
                    control={control}
                    name="subdomain"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subdomain</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. web" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Termination Grace Period */}
            <FormField
                control={control}
                name="termination_grace_period_seconds"
                render={({ field }) => (
                    <FormItem className="space-y-4 px-1">
                        <div className="flex justify-between items-center">
                            <FormLabel className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-primary" />
                                Termination Grace Period
                            </FormLabel>
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {field.value} seconds
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
                        <FormDescription className="text-[11px]">
                            Duration in seconds the pod needs to terminate gracefully.
                        </FormDescription>
                    </FormItem>
                )}
            />

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                    control={control}
                    name="automount_service_account_token"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Auto-mount SA Token
                                </FormLabel>
                            </div>
                            <FormControl>
                                <Switch
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
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                    <Network className="h-4 w-4 text-primary" />
                                    Host Network
                                </FormLabel>
                            </div>
                            <FormControl>
                                <Switch
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
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4 text-primary" />
                                    Enable Service Links
                                </FormLabel>
                            </div>
                            <FormControl>
                                <Switch
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
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                    <Share2 className="h-4 w-4 text-primary" />
                                    Share Process NS
                                </FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

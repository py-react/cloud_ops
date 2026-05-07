import React, { useState, useEffect } from "react";
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
import { UseFormReturn } from "react-hook-form";
import { Package, Network, Route, Boxes, Layers, Globe, Database, Tag, KeyRound, Settings } from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

interface ReleaseDetailsStepProps {
    form: UseFormReturn<any>;
}

interface DeploymentStrategy {
    id: number;
    type: string;
    description: string;
}

const ReleaseDetailsStep: React.FC<ReleaseDetailsStepProps> = ({ form }) => {
    const category = form.watch("category") || "kubernetes";
    const selectedChart = form.watch("chart_name");

    const [charts, setCharts] = useState<any[]>([]);
    const [environments, setEnvironments] = useState<any[]>([]);
    const [strategies, setStrategies] = useState<DeploymentStrategy[]>([]);
    const [credentials, setCredentials] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category === 'kubernetes') {
            fetchKubernetesData();
        } else if (category === 'package') {
            if (!form.watch("package_type")) {
                form.setValue("package_type", "npm");
            }
            fetchCredentials();
        }
    }, [category]);

    useEffect(() => {
        if (category === 'kubernetes' && selectedChart) {
            fetchEnvironments(selectedChart);
        } else {
            setEnvironments([]);
        }
    }, [selectedChart, category]);

    const fetchCredentials = async () => {
        try {
            const creds = await DefaultService.apiIntegrationCredentialsGet();
            const packageType = form.watch("package_type") || "npm";
            const filtered = creds?.filter((c: any) => c.provider === packageType) || [];
            setCredentials(filtered);
        } catch (err: any) {
            console.error("Failed to fetch credentials:", err);
        }
    };

    const fetchKubernetesData = async () => {
        try {
            setLoading(true);
            const [chartsRes, strategiesRes] = await Promise.all([
                fetch('/api/library').then(r => r.json()),
                DefaultService.apiIntegrationKubernetesDeploymentStrategyGet()
            ]);

            setCharts((chartsRes || []).filter((c: any) => c.type === 'template'));
            setStrategies(strategiesRes?.strategies || []);
        } catch (err: any) {
            toast.error("Failed to fetch chart data");
        } finally {
            setLoading(false);
        }
    };

    const fetchEnvironments = async (chartName: string) => {
        try {
            const res = await fetch(`/api/library/values?template=${chartName}`);
            const data = await res.json();
            setEnvironments(data || []);
        } catch {
            toast.error("Failed to fetch environments");
        }
    };

    // Fetch credentials when package_type changes
    useEffect(() => {
        if (category === 'package') {
            fetchCredentials();
        }
    }, [form.watch("package_type")]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
            {category === 'kubernetes' ? (
                <div className="grid grid-cols-1 gap-8">
                    {/* Strategy Selection */}
                    <FormField
                        control={form.control}
                        name="deployment_strategy_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Route className="h-3.5 w-3.5 opacity-60" /> Deployment Strategy *
                                </FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(parseInt(value) || null)}
                                    value={field.value?.toString() || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                            <SelectValue placeholder="Select rollout strategy" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {strategies.map((strategy) => (
                                            <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                                {strategy.type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-[10px]">
                                    Determines how the new version is rolled out (RollingUpdate, Recreate, etc.)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Chart Selection */}
                        <FormField
                            control={form.control}
                            name="chart_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5 opacity-60" /> Chart *
                                    </FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue("env_name", ""); // Reset env on chart change
                                        }}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder={loading ? "Loading..." : "Select Chart"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {charts.map((c) => (
                                                <SelectItem key={c.name} value={c.name}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Environment Selection */}
                        <FormField
                            control={form.control}
                            name="env_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 opacity-60" /> Environment *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                        disabled={!selectedChart || environments.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder={!selectedChart ? "Select a chart first" : (environments.length === 0 ? "No environments" : "Select Env")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {environments.map((e) => (
                                                <SelectItem key={e.env_name} value={e.env_name}>
                                                    {e.env_name}
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
            ) : (
                /* Package Category — Kept as is */
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        <FormField
                            control={form.control}
                            name="package_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Database className="h-3.5 w-3.5 opacity-60" /> Registry Type *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="npm">NPM Package</SelectItem>
                                            <SelectItem value="pypi">PyPI Package</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="package_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                    Full Package Name *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g., @my-org/core-api"
                                        className="h-11 bg-background border-border/40 shadow-sm"
                                    />
                                </FormControl>
                                <FormDescription className="text-[10px]">
                                    Exact name as it appears in the distribution registry.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="registry_credential_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <KeyRound className="h-3.5 w-3.5 opacity-60" /> Publish Credential
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select
                                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                        value={field.value?.toString() || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder={credentials.length === 0 ? "No credentials found" : "Select credential for publishing"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {credentials.map((cred: any) => (
                                                <SelectItem key={cred.id} value={cred.id.toString()}>
                                                    {cred.name} ({cred.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {field.value && (
                                        <button
                                            type="button"
                                            onClick={() => field.onChange(null)}
                                            className="px-3 h-11 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
                                        >✕</button>
                                    )}
                                </div>
                                <FormDescription className="text-[10px]">
                                    Token used for publishing. Leave empty to use global credential.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
};

export default ReleaseDetailsStep;

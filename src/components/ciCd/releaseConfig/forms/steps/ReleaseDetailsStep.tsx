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
import { Package, Network, Route, Boxes, Layers, Globe, Database, Tag, KeyRound } from "lucide-react";
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
    const namespace = form.watch("namespace") || "default";

    const [deployments, setDeployments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [strategies, setStrategies] = useState<DeploymentStrategy[]>([]);
    const [httpRoutes, setHttpRoutes] = useState<any[]>([]);
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
    }, [category, namespace]);

    const fetchCredentials = async () => {
        try {
            const packageType = form.watch("package_type") || "npm";
            const creds = await DefaultService.apiIntegrationCredentialsGet();
            const filtered = creds?.filter((c: any) => c.provider === packageType) || [];
            setCredentials(filtered);
        } catch (err: any) {
            console.error("Failed to fetch credentials:", err);
        }
    };

    // Fetch credentials when package_type changes
    useEffect(() => {
        if (category === 'package') {
            fetchCredentials();
        }
    }, [form.watch("package_type")]);

    // Also fetch on mount to support edit mode
    useEffect(() => {
        if (category === 'package') {
            fetchCredentials();
        }
    }, []);

    const fetchKubernetesData = async () => {
        try {
            setLoading(true);
            const [deps, svcs, strs, routes]: any = await Promise.all([
                DefaultService.apiIntegrationKubernetesLibraryDeploymentGet({ namespace }),
                DefaultService.apiIntegrationKubernetesLibraryServiceGet({ namespace }),
                DefaultService.apiIntegrationKubernetesDeploymentStrategyGet(),
                DefaultService.apiIntegrationKubernetesLibraryHttprouteGet({ namespace })
            ]);

            setDeployments(deps || []);
            setServices(svcs || []);
            setStrategies(strs?.strategies || []);
            setHttpRoutes(routes || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch supporting documents");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
            {category === 'kubernetes' ? (
                <div className="grid grid-cols-1 gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="kind"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 opacity-60" /> Resource Kind
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || 'Deployment'}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 focus-visible:ring-primary/20 shadow-sm">
                                                <SelectValue placeholder="Select resource kind" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Deployment">Deployment</SelectItem>
                                            <SelectItem value="StatefulSet">StatefulSet</SelectItem>
                                            <SelectItem value="ReplicaSet">ReplicaSet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deployment_strategy_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Route className="h-3.5 w-3.5 opacity-60" /> Strategy
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value) || null)}
                                            value={field.value?.toString() || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                    <SelectValue placeholder="Select strategy" />
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
                                        {field.value && (
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(null)}
                                                className="px-3 h-11 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
                                            >✕</button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="derived_deployment_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 opacity-60" /> Library Deployment *
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        value={field.value?.toString() || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder={loading ? "Loading..." : "Select a deployment template"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {deployments.map((d) => (
                                                <SelectItem key={d.id} value={d.id.toString()}>
                                                    {d.deployment_name || d.name}
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="service_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Network className="h-3.5 w-3.5 opacity-60" /> Library Service
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString() || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                    <SelectValue placeholder="Optional Service" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.name}
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="http_route_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 opacity-60" /> HTTP Route
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString() || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                    <SelectValue placeholder="Optional Route" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {httpRoutes.map((r) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>
                                                        {r.name}
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            ) : (
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

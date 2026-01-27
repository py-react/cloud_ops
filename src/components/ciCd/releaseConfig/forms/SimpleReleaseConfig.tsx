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
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, GitBranch, Package, Tag } from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

interface SimpleReleaseConfigProps {
    form: UseFormReturn<any>;
}

const SimpleReleaseConfig: React.FC<SimpleReleaseConfigProps> = ({ form }) => {
    const namespace = form.watch("namespace") || "default";
    const requiredSourceControl = form.watch("required_source_control") || false;
    const selectedRepo = form.watch("code_source_control_name");
    const [deployments, setDeployments] = useState<any[]>([]);
    const [sourceControls, setSourceControls] = useState<any[]>([]);
    const [branchesMap, setBranchesMap] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);

    const availableBranches = selectedRepo ? (branchesMap[selectedRepo] || []) : [];

    useEffect(() => {
        fetchDeployments();
        fetchSourceControls();
    }, [namespace]);

    // Reset branch when repo changes
    useEffect(() => {
        if (selectedRepo && !availableBranches.includes(form.getValues("source_control_branch"))) {
            form.setValue("source_control_branch", "");
        }
    }, [selectedRepo]);

    const fetchDeployments = async () => {
        try {
            setLoading(true);
            const res: any = await DefaultService.apiIntegrationKubernetesLibraryDeploymentGet({ namespace });
            setDeployments(res || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch deployments");
        } finally {
            setLoading(false);
        }
    };

    const fetchSourceControls = async () => {
        try {
            const res: any = await DefaultService.apiIntegrationGithubPollingGet();
            if (res && res.allowed_branches) {
                // Store the full branches map for later use
                setBranchesMap(res.allowed_branches);
                // Extract repo names
                const repos = Object.keys(res.allowed_branches).map(name => ({ name }));
                setSourceControls(repos);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch source controls");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Release Config Identity */}
            <div className="grid grid-cols-1 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Settings className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Release Configuration</h4>
                </div>

                <FormField
                    control={form.control}
                    name="deployment_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                Release Config Name *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., my-app-release"
                                    className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                A unique name to identify this release configuration
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="namespace"
                    disabled
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                Target Namespace *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., prod, staging, default"
                                    className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                The Kubernetes namespace where this release will be deployed
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 opacity-60" /> Type *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., web-app, api-service, worker"
                                    className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Categorize this release configuration (e.g., web-app, microservice, batch-job)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Resource Kind</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'Deployment'}>
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20">
                                        <SelectValue placeholder="Select resource kind" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Deployment">Deployment</SelectItem>
                                    <SelectItem value="StatefulSet">StatefulSet</SelectItem>
                                    <SelectItem value="ReplicaSet">ReplicaSet</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-[10px]">
                                The type of Kubernetes resource to generate
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

            </div>

            {/* Source Control Section */}
            <div className="grid grid-cols-1 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <GitBranch className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Source Control</h4>
                </div>

                <FormField
                    control={form.control}
                    name="required_source_control"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/40 p-4 bg-background">
                            <div className="space-y-0.5">
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Required Source Control
                                </FormLabel>
                                <FormDescription className="text-[10px]">
                                    Enable if this release requires a source control repository
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {requiredSourceControl && (
                    <FormField
                        control={form.control}
                        name="code_source_control_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                    Source Repository *
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl bg-background border-border/40">
                                                <SelectValue placeholder="Select a source control" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sourceControls.map((sc) => (
                                                <SelectItem key={sc.name} value={sc.name}>
                                                    {sc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {field.value && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange(null);
                                                form.setValue("source_control_branch", null);
                                            }}
                                            className="px-3 h-11 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                            title="Clear selection"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <FormDescription className="text-[10px]">
                                    Select the source control repository for this release
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {requiredSourceControl && selectedRepo && (
                    <FormField
                        control={form.control}
                        name="source_control_branch"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                    Branch *
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl bg-background border-border/40">
                                                <SelectValue placeholder="Select a branch" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableBranches.length === 0 ? (
                                                <SelectItem value="no-branches" disabled>No branches available</SelectItem>
                                            ) : (
                                                availableBranches.map((branch) => (
                                                    <SelectItem key={branch} value={branch}>
                                                        {branch}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {field.value && (
                                        <button
                                            type="button"
                                            onClick={() => field.onChange(null)}
                                            className="px-3 h-11 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                            title="Clear selection"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <FormDescription className="text-[10px]">
                                    Select the branch to use for this release
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>

            {/* Derived Deployment Selection */}
            <div className="grid grid-cols-1 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Derived Deployment</h4>
                </div>

                <FormField
                    control={form.control}
                    name="derived_deployment_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                                Library Deployment *
                            </FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl bg-background border-border/40">
                                        <SelectValue placeholder="Select a deployment from library" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {loading ? (
                                        <SelectItem value="loading" disabled>Loading deployments...</SelectItem>
                                    ) : deployments.length === 0 ? (
                                        <SelectItem value="empty" disabled>No deployments available</SelectItem>
                                    ) : (
                                        deployments.map((deployment) => (
                                            <SelectItem key={deployment.id} value={deployment.id.toString()}>
                                                {deployment.deployment_name || deployment.name || `Deployment ${deployment.id}`}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-[10px]">
                                Select a deployment configuration from your library
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                        <span className="font-bold text-primary not-italic">Note:</span> Library deployments are reusable deployment configurations managed in Settings → CI/CD → Library → Deployments.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SimpleReleaseConfig;

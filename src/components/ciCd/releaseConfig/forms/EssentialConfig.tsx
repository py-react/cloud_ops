import React from "react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData } from "./components/formUtils";
import { Settings, Container, Target, Tag, Plug, Sliders, Database, Calendar } from "lucide-react";
import { ProfileSelector } from "@/components/ciCd/library/ProfileSelector";

interface EssentialConfigProps {
    form: UseFormReturn<DeploymentFormData>;
}

const EssentialConfig: React.FC<EssentialConfigProps> = ({ form }) => {
    const namespace = form.watch("namespace") || "default";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 1. Basic Identity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Settings className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Identity & Scope</h4>
                </div>

                <FormField
                    control={form.control}
                    name="deployment_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Deployment Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., my-api-service" className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="namespace"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Target Namespace</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., prod-env" className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 2. Reusable Profiles Section */}
            <div className="grid grid-cols-1 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Container className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Reusable Components</h4>
                </div>

                <FormField
                    control={form.control}
                    name="container_profile_ids"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Container className="h-3.5 w-3.5 opacity-60" /> Container Profiles *
                            </FormLabel>
                            <FormControl>
                                <ProfileSelector
                                    profileType="container"
                                    namespace={namespace}
                                    selectedIds={field.value || []}
                                    onChange={field.onChange}
                                    multiple={true}
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Select one or more container profiles from your library
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="volume_profile_ids"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5 opacity-60" /> Volume Profiles
                            </FormLabel>
                            <FormControl>
                                <ProfileSelector
                                    profileType="volume"
                                    namespace={namespace}
                                    selectedIds={field.value || []}
                                    onChange={field.onChange}
                                    multiple={true}
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Optional: Select volume profiles for persistent storage
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="scheduling_profile_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 opacity-60" /> Scheduling Profile
                            </FormLabel>
                            <FormControl>
                                <ProfileSelector
                                    profileType="scheduling"
                                    namespace={namespace}
                                    selectedIds={field.value ? [field.value] : []}
                                    onChange={(ids) => field.onChange(ids[0] || null)}
                                    multiple={false}
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Optional: Node selectors, tolerations, and affinity rules
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">
                        <span className="font-bold text-primary not-italic">Note:</span> Profiles are reusable components managed in your library. Visit Settings → CI/CD → Library to create and manage profiles.
                    </p>
                </div>
            </div>

            {/* 3. Basic Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Tag className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Basic Config</h4>
                </div>

                <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Release Tag</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., latest or v1.0.0" className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Type</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., web-app" className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="replicas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Replicas</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 4. Integration & Strategy Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border/50 bg-muted/5">
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Target className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Pipeline & Strategy</h4>
                </div>

                <FormField
                    control={form.control}
                    name="code_source_control_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 font-bold flex items-center gap-1.5">
                                <Plug className="h-3.5 w-3.5 opacity-60" /> Source Repository
                            </FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="owner/repo" className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="deployment_strategy_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 font-bold flex items-center gap-1.5">
                                <Sliders className="h-3.5 w-3.5 opacity-60" /> Strategy ID
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    className="h-11 rounded-xl bg-background border-border/40 focus-visible:ring-primary/20"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

export default EssentialConfig;

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl as FormControlUI
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, List, Target, Settings2, Plus, Info, Cpu, X, Box, ExternalLink, Globe, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { DefaultService } from "@/gingerJs_api_client";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

interface DerivedServiceFormProps {
    form: UseFormReturn<any>;
    namespace: string;
}

const DerivedServiceForm: React.FC<DerivedServiceFormProps> = ({ form, namespace }) => {
    const [attributeInput, setAttributeInput] = React.useState('');
    const [selectedProfileId, setSelectedProfileId] = React.useState<number | null>(null);
    const [serviceProfiles, setServiceProfiles] = React.useState<any[]>([]);
    const [metadataProfiles, setMetadataProfiles] = React.useState<any[]>([]);
    const [selectorProfiles, setSelectorProfiles] = React.useState<any[]>([]);

    const dynamicAttr = form.watch("dynamic_attr") || {};
    const type = form.watch("type") || "ClusterIP";

    React.useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const [svc, meta, sel] = await Promise.all([
                    DefaultService.apiIntegrationKubernetesLibraryServiceProfileGet({ namespace }),
                    DefaultService.apiIntegrationKubernetesLibraryServiceMetadataGet({ namespace }),
                    DefaultService.apiIntegrationKubernetesLibraryServiceSelectorGet({ namespace })
                ]);
                setServiceProfiles(svc as any[]);
                setMetadataProfiles(meta as any[]);
                setSelectorProfiles(sel as any[]);
            } catch (error) {
                console.error("Error fetching service profiles:", error);
            }
        };
        fetchProfiles();
    }, [namespace]);

    const handleAddAttribute = () => {
        if (!attributeInput || !selectedProfileId) return;
        const newAttr = { ...dynamicAttr };
        newAttr[attributeInput] = selectedProfileId;
        form.setValue("dynamic_attr", newAttr);
        setAttributeInput("");
        setSelectedProfileId(null);
    };

    const getProfileName = (id: number) => {
        const profile = serviceProfiles.find(p => p.id === id);
        return profile ? profile.name : `ID: ${id}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Basic Service Info */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 font-black">Basic Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Service Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., my-service" />
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
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> Namespace <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Profiles */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 font-black">Profiles</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Cpu className="h-3.5 w-3.5 opacity-60" /> Service Type <RequiredBadge />
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || "ClusterIP"}>
                                        <FormControlUI>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControlUI>
                                        <SelectContent>
                                            <SelectItem value="ClusterIP">ClusterIP</SelectItem>
                                            <SelectItem value="NodePort">NodePort</SelectItem>
                                            <SelectItem value="LoadBalancer">LoadBalancer</SelectItem>
                                            <SelectItem value="ExternalName">ExternalName</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="metadata_profile_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 opacity-60" /> Metadata Profile <RequiredBadge />
                                    </FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                                        <FormControlUI>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select metadata profile" />
                                            </SelectTrigger>
                                        </FormControlUI>
                                        <SelectContent>
                                            {metadataProfiles.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="selector_profile_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 opacity-60" /> Selector Profile <RequiredBadge />
                                    </FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                                        <FormControlUI>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select selector profile" />
                                            </SelectTrigger>
                                        </FormControlUI>
                                        <SelectContent>
                                            {selectorProfiles.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                {/* Dynamic Attributes (Additional Profiles) */}
                <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 font-black">Dynamic Attributes</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium pb-2">
                        Attach additional specifications from Service Profiles under specific keys in <code>spec</code>.
                    </p>

                    {Object.keys(dynamicAttr).length > 0 && (
                        <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(dynamicAttr).map(([key, profileId]: [string, any]) => (
                                    <Badge
                                        key={key}
                                        variant="outline"
                                        className={cn(
                                            "pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all group",
                                            "font-mono text-xs font-semibold"
                                        )}
                                    >
                                        <span className="flex items-center gap-1">
                                            {key}: {getProfileName(profileId)}
                                        </span>
                                        <div className="w-px h-3 bg-primary/20 mx-0.5" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newAttr = { ...dynamicAttr };
                                                delete newAttr[key];
                                                form.setValue("dynamic_attr", newAttr);
                                            }}
                                            className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                                        >
                                            <X className="h-3 w-3 text-destructive" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-end justify-between w-full gap-4 pt-2">
                        <div className="flex flex-1 gap-2">
                            <div className="relative flex-1">
                                <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Key (e.g., config)"
                                    value={attributeInput}
                                    onChange={(e) => setAttributeInput(e.target.value)}
                                    className="h-10 pl-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20"
                                />
                            </div>

                            <div className="flex-1">
                                <Select onValueChange={(val) => setSelectedProfileId(parseInt(val))} value={selectedProfileId?.toString() || ""}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select Profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceProfiles.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddAttribute}
                            className="h-10 px-4 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        >
                            <Plus className="h-4 w-4" />
                            Add Attribute
                        </Button>
                    </div>

                    {Object.keys(dynamicAttr).length === 0 && (
                        <div className="p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
                            <Box className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs font-bold text-muted-foreground">No dynamic attributes configured yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 font-black">Advanced Spec Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="cluster_ip"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Cluster IP</FormLabel>
                                <FormControlUI>
                                    <Input {...field} placeholder="e.g. 10.96.0.1 or None" className="h-9" />
                                </FormControlUI>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ip_family_policy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">IP Family Policy</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "SingleStack"}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select policy" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="SingleStack">SingleStack</SelectItem>
                                        <SelectItem value="PreferDualStack">PreferDualStack</SelectItem>
                                        <SelectItem value="RequireDualStack">RequireDualStack</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="session_affinity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Session Affinity</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "None"}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select affinity" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="ClientIP">ClientIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="internal_traffic_policy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Internal Traffic Policy</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "Cluster"}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select policy" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="Cluster">Cluster</SelectItem>
                                        <SelectItem value="Local">Local</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    {(type === "NodePort" || type === "LoadBalancer") && (
                        <FormField
                            control={form.control}
                            name="external_traffic_policy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">External Traffic Policy</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || "Cluster"}>
                                        <FormControlUI>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select policy" />
                                            </SelectTrigger>
                                        </FormControlUI>
                                        <SelectContent>
                                            <SelectItem value="Cluster">Cluster</SelectItem>
                                            <SelectItem value="Local">Local</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    )}

                    {type === "LoadBalancer" && (
                        <FormField
                            control={form.control}
                            name="load_balancer_ip"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">LoadBalancer IP</FormLabel>
                                    <FormControlUI>
                                        <Input {...field} placeholder="Static LB IP" className="h-9" />
                                    </FormControlUI>
                                </FormItem>
                            )}
                        />
                    )}

                    {type === "LoadBalancer" && (
                        <FormField
                            control={form.control}
                            name="load_balancer_class"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">LB Class</FormLabel>
                                    <FormControlUI>
                                        <Input {...field} placeholder="LB implementation" className="h-9" />
                                    </FormControlUI>
                                </FormItem>
                            )}
                        />
                    )}

                    {type === "ExternalName" && (
                        <FormField
                            control={form.control}
                            name="external_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">External Name</FormLabel>
                                    <FormControlUI>
                                        <Input {...field} placeholder="DNS name" className="h-9" />
                                    </FormControlUI>
                                </FormItem>
                            )}
                        />
                    )}

                    {type === "LoadBalancer" && (
                        <FormField
                            control={form.control}
                            name="health_check_node_port"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Health Check NodePort</FormLabel>
                                    <FormControlUI>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                                            placeholder="Port"
                                            className="h-9"
                                        />
                                    </FormControlUI>
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <FormField
                        control={form.control}
                        name="publish_not_ready_addresses"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-background">
                                <FormControlUI>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControlUI>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                                        Publish Not Ready
                                    </FormLabel>
                                    <p className="text-[10px] text-muted-foreground">Include unready Pods in endpoints</p>
                                </div>
                            </FormItem>
                        )}
                    />

                    {type === "LoadBalancer" && (
                        <FormField
                            control={form.control}
                            name="allocate_load_balancer_node_ports"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-background">
                                    <FormControlUI>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControlUI>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                                            Allocate LB NodePorts
                                        </FormLabel>
                                        <p className="text-[10px] text-muted-foreground">Auto-allocate NodePorts for LB</p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DerivedServiceForm;

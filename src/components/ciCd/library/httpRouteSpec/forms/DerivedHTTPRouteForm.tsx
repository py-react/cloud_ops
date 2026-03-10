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
import { Tag, List, Target, Settings2, Globe, WaypointsIcon, Info } from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

interface DerivedHTTPRouteFormProps {
    form: UseFormReturn<any>;
    namespace: string;
}

const DerivedHTTPRouteForm: React.FC<DerivedHTTPRouteFormProps> = ({ form, namespace }) => {
    const [metadataProfiles, setMetadataProfiles] = React.useState<any[]>([]);
    const [hostnamesProfiles, setHostnamesProfiles] = React.useState<any[]>([]);
    const [rulesProfiles, setRulesProfiles] = React.useState<any[]>([]);
    const [parentRefsProfiles, setParentRefsProfiles] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const [meta, host, rules, parents] = await Promise.all([
                    (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteMetadataGet({ namespace }),
                    (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteHostnamesGet({ namespace }),
                    (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteRulesGet({ namespace }),
                    (DefaultService as any).apiIntegrationKubernetesLibraryHttprouteParentRefsGet({ namespace })
                ]);
                setMetadataProfiles(meta || []);
                setHostnamesProfiles(host || []);
                setRulesProfiles(rules || []);
                setParentRefsProfiles(parents || []);
            } catch (error) {
                console.error("Error fetching HTTPRoute profiles:", error);
            }
        };
        fetchProfiles();
    }, [namespace]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Basic Info */}
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
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Route Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., my-api-route" />
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

            {/* Profiles Selection */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 font-black">Profile Composition</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="metadata_profile_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Metadata Profile
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={field.value?.toString() || ""}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select metadata profile" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="null" disabled>None</SelectItem>
                                        {metadataProfiles.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hostnames_profile_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> Hostnames Profile
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={field.value?.toString() || ""}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select hostnames profile" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="null" disabled>None</SelectItem>
                                        {hostnamesProfiles.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="rules_profile_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <WaypointsIcon className="h-3.5 w-3.5 opacity-60" /> Rules Profile
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={field.value?.toString() || ""}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select rules profile" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="null" disabled>None</SelectItem>
                                        {rulesProfiles.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="parent_refs_profile_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5 opacity-60" /> ParentRefs Profile
                                </FormLabel>
                                <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={field.value?.toString() || ""}>
                                    <FormControlUI>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select parentRefs profile" />
                                        </SelectTrigger>
                                    </FormControlUI>
                                    <SelectContent>
                                        <SelectItem value="null" disabled>None</SelectItem>
                                        {parentRefsProfiles.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

        </div>
    );
};

export default DerivedHTTPRouteForm;

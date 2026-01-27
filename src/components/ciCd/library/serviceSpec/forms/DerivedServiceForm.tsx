import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tag, List, Target, Settings2, Plus, Info, Cpu, X, Box, ExternalLink } from "lucide-react";
import { ProfileSelector } from "@/components/ciCd/library/ProfileSelector";
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
    const [selectedProfile, setSelectedProfile] = React.useState<number[]>([]);
    const [serviceProfiles, setServiceProfiles] = React.useState<any[]>([]);

    const dynamicAttr = form.watch("dynamic_attr") || {};

    React.useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const data = await DefaultService.apiIntegrationKubernetesLibraryServiceProfileGet({ namespace });
                setServiceProfiles(data as any[]);
            } catch (error) {
                console.error("Error fetching service profiles:", error);
            }
        };
        fetchProfiles();
    }, [namespace]);

    const handleAddAttribute = () => {
        if (!attributeInput || selectedProfile.length === 0) return;
        const newAttr = { ...dynamicAttr };
        newAttr[attributeInput] = selectedProfile[0];
        form.setValue("dynamic_attr", newAttr);
        setAttributeInput("");
        setSelectedProfile([]);
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
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basic Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Service Name *</FormLabel>
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
                                <FormLabel>Namespace *</FormLabel>
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
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profiles</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="metadata_profile_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 opacity-60" /> Metadata Profile (Labels, Annotations)
                                    </FormLabel>
                                    <FormControl>
                                        <ProfileSelector
                                            profileType="service_metadata_profile"
                                            namespace={namespace}
                                            selectedIds={field.value ? [field.value] : []}
                                            onChange={(ids) => field.onChange(ids[0] || null)}
                                            multiple={false}
                                        />
                                    </FormControl>
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
                                        <Target className="h-3.5 w-3.5 opacity-60" /> Selector Profile (Pod Match)
                                    </FormLabel>
                                    <FormControl>
                                        <ProfileSelector
                                            profileType="service_selector_profile"
                                            namespace={namespace}
                                            selectedIds={field.value ? [field.value] : []}
                                            onChange={(ids) => field.onChange(ids[0] || null)}
                                            multiple={false}
                                        />
                                    </FormControl>
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
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dynamic Attributes</h3>
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
                                    className="h-10 pl-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl"
                                />
                            </div>

                            <div className="flex-1">
                                <ProfileSelector
                                    profileType="service_profile"
                                    namespace={namespace}
                                    selectedIds={selectedProfile}
                                    onChange={setSelectedProfile}
                                    multiple={false}
                                />
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
        </div>
    );
};

export default DerivedServiceForm;

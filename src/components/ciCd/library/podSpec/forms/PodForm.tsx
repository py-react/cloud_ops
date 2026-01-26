import React, { useEffect, useState, useMemo } from "react";
import yaml from "js-yaml";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProfileSelector } from "@/components/ciCd/library/ProfileSelector";
import { DefaultService } from "@/gingerJs_api_client";
import Editor from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Info, Cpu, Box, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequiredBadge } from "@/components/docker/network/forms/badges";
import { cn } from "@/libs/utils";
import { Tabs } from "@/components/ui/tabs";
import { ResourceDetailView } from "../../ResourceDetailView";

export const PodForm = ({ control, setValue, watch, namespace }: { control: any; setValue: any; watch: any; namespace: string }) => {
    const selectedContainers = watch("containers") || [];
    const selectedMetadataProfile = watch("metadata_profile_id");
    const dynamicAttr = watch("dynamic_attr") || {};

    const [attributeInput, setAttributeInput] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<number[]>([]);
    const [podProfiles, setPodProfiles] = useState<any[]>([]);

    useEffect(() => {
        const fetchPodProfiles = async () => {
            try {
                const data = await DefaultService.apiIntegrationKubernetesLibraryPodProfileGet({ namespace });
                setPodProfiles(data as any[]);
            } catch (error) {
                console.error("Error fetching pod profiles:", error);
            }
        };
        fetchPodProfiles();
    }, [namespace]);

    const handleAddAttribute = () => {
        if (!attributeInput || selectedProfile.length === 0) return;

        const newAttr = { ...dynamicAttr };
        newAttr[attributeInput] = selectedProfile[0];
        setValue("dynamic_attr", newAttr);

        setAttributeInput("");
        setSelectedProfile([]);
    };

    const getProfileName = (id: number) => {
        const profile = podProfiles.find(p => p.id === id);
        return profile ? `${profile.name} (${profile.type})` : `ID: ${id}`;
    };

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pod Name <RequiredBadge /></FormLabel>
                        <FormControl>
                            <Input placeholder="Pod name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-4">
                <FormLabel>Containers <RequiredBadge /></FormLabel>
                <ProfileSelector
                    profileType="container"
                    namespace={namespace}
                    selectedIds={selectedContainers}
                    onChange={(ids) => setValue("containers", ids)}
                    multiple={true}
                    label="Select Containers"
                />
            </div>

            <div className="space-y-4">
                <FormLabel>Metadata Profile</FormLabel>
                <ProfileSelector
                    profileType="pod_metadata_profile"
                    namespace={namespace}
                    selectedIds={selectedMetadataProfile ? [selectedMetadataProfile] : []}
                    onChange={(ids) => setValue("metadata_profile_id", ids[0])}
                    multiple={false}
                    label="Select Metadata Profile"
                />
            </div>

            <div className="space-y-4 border-t pt-4">
                <div>
                    <FormLabel className="text-sm font-bold text-foreground">
                        Profile <RequiredBadge />
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground font-medium mt-1">
                        Configure profile to attach
                    </FormDescription>
                </div>

                {Object.keys(dynamicAttr).length > 0 && (
                    <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <Cpu className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-widest">
                                Configured profiles ({Object.keys(dynamicAttr).length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(dynamicAttr).map((key) => (
                                <Badge
                                    key={key}
                                    variant="outline"
                                    className={cn(
                                        "pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all group",
                                        "font-mono text-xs font-semibold"
                                    )}
                                >
                                    <span
                                        className="cursor-pointer hover:underline flex items-center gap-1"
                                        onClick={() => {
                                            const url = `${window.location.pathname}?focusId=${dynamicAttr[key]}&resourceType=pod_profile&autoOpen=true`;
                                            window.open(url, "_blank");
                                        }}
                                    >
                                        {key}: {getProfileName(dynamicAttr[key])}
                                        <ExternalLink className="h-3 w-3 opacity-60" />
                                    </span>
                                    <div className="w-px h-3 bg-primary/20 mx-0.5" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newAttr = { ...dynamicAttr };
                                            delete newAttr[key];
                                            setValue("dynamic_attr", newAttr);
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

                <div className="flex items-end justify-between w-full gap-4">
                    <div className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Attribute Name (e.g., config)"
                                value={attributeInput}
                                onChange={(e) => setAttributeInput(e.target.value)}
                                className="h-10 pl-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl"
                            />
                        </div>

                        <div className="flex-1">
                            <ProfileSelector
                                profileType="pod_profile"
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
                        Add Profile
                    </Button>
                </div>

                {Object.keys(dynamicAttr).length === 0 && (
                    <div className="p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
                        <Box className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground">No profile configured yet</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">Add your first profile above to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PodAdvancedConfig = ({ control, namespace }: { control: any; namespace: string }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [profiles, setProfiles] = useState<any[]>([]);
    const [containers, setContainers] = useState<any[]>([]);
    const [metadataProfiles, setMetadataProfiles] = useState<any[]>([]);
    const [podProfiles, setPodProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const formValues = control._formValues;
    const selectedContainerIds = formValues.containers || [];
    const selectedMetadataId = formValues.metadata_profile_id;
    const dynamicAttr = formValues.dynamic_attr || {};

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedContainerIds.length && !selectedMetadataId && !Object.keys(dynamicAttr).length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Collect all entity profile IDs (sub-profiles from containers + pod profiles)
                // Note: We'd need the containers first to get their sub-profiles if we wanted true IDs here,
                // but since the server supports selective fetching, we'll fetch them after or use namespace-wide if small.
                // For now, let's optimize the primary resources.

                const [cRes, mRes, pRes] = await Promise.all([
                    DefaultService.apiIntegrationKubernetesLibraryContainerGet({
                        namespace,
                        ids: selectedContainerIds.join(',')
                    } as any),
                    DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfileGet({
                        namespace,
                        ids: selectedMetadataId ? String(selectedMetadataId) : undefined
                    } as any),
                    DefaultService.apiIntegrationKubernetesLibraryPodProfileGet({
                        namespace,
                        ids: Object.values(dynamicAttr).join(',')
                    } as any)
                ]);

                setContainers((cRes as any[]).reduce((acc, container) => {
                    acc[container.id] = container;
                    return acc;
                }, {} as Record<number, any>));

                setMetadataProfiles((mRes as any[]).reduce((acc, metaProfile) => {
                    acc[metaProfile.id] = metaProfile;
                    return acc;
                }, {} as Record<number, any>));

                setPodProfiles(pRes as any[]);

                // Collect sub-profile IDs from the fetched containers
                const subProfileIds = (cRes as any[]).flatMap(c =>
                    c.dynamic_attr ? Object.values(c.dynamic_attr) : []
                );

                if (subProfileIds.length > 0) {
                    const profileRes = await DefaultService.apiIntegrationKubernetesLibraryProfileGet({
                        namespace,
                        ids: Array.from(new Set(subProfileIds)).join(',')
                    } as any);

                    setProfiles((profileRes as any[]).reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {} as Record<number, any>));
                }

            } catch (error) {
                console.error("Error fetching preview data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [namespace, selectedContainerIds, selectedMetadataId, dynamicAttr]);

    const composedYaml = useMemo(() => {
        if (loading) return "Loading preview...";

        const result: any = {
            metadata: {},
            spec: {
                containers: []
            }
        };
        console.log("selectedMetadataId", selectedMetadataId);
        console.log("selectedContainerIds", selectedContainerIds);
        // 1. Handle Metadata Profile
        if (selectedMetadataId) {
            const metaProfile = metadataProfiles[selectedMetadataId];
            if (metaProfile && metaProfile.config) {
                try {
                    const config = typeof metaProfile.config === 'string' ? JSON.parse(metaProfile.config) : metaProfile.config;
                    result.metadata = config;
                } catch (e) {
                    result.metadata = { error: "Failed to parse metadata config" };
                }
            }
        }

        // 2. Handle Containers
        selectedContainerIds.forEach((id: number) => {
            const container = containers[id];
            if (container) {
                const cSpec: any = {
                    name: container.name,
                    image: "<IMAGE_FILLED_AT_RUNTIME>",
                    imagePullPolicy: container.image_pull_policy || "IfNotPresent",
                };

                if (container.command && container.command.length > 0) cSpec.command = container.command;
                if (container.args && container.args.length > 0) cSpec.args = container.args;
                if (container.working_dir) cSpec.workingDir = container.working_dir;

                // Merge container profiles
                if (container.dynamic_attr) {
                    Object.entries(container.dynamic_attr).forEach(([key, value]: [string, any]) => {
                        // In real scenario, we'd need to fetch these sub-profiles too if we want full preview,
                        // but for now we follow the existing pattern in DerivedContainerForm
                        cSpec[key] = JSON.parse(profiles[value].config);
                    });
                }
                result.spec.containers.push(cSpec);
            }
        });

        // 3. Handle Pod Settings
        if (formValues.service_account_name) result.spec.serviceAccountName = formValues.service_account_name;
        if (formValues.automount_service_account_token !== undefined) result.spec.automountServiceAccountToken = formValues.automount_service_account_token;
        if (formValues.host_network !== undefined) result.spec.hostNetwork = formValues.host_network;
        if (formValues.dns_policy) result.spec.dnsPolicy = formValues.dns_policy;
        if (formValues.hostname) result.spec.hostname = formValues.hostname;
        if (formValues.subdomain) result.spec.subdomain = formValues.subdomain;
        if (formValues.termination_grace_period_seconds !== undefined) result.spec.terminationGracePeriodSeconds = formValues.termination_grace_period_seconds;
        if (formValues.enable_service_links !== undefined) result.spec.enableServiceLinks = formValues.enable_service_links;
        if (formValues.share_process_namespace !== undefined) result.spec.shareProcessNamespace = formValues.share_process_namespace;

        // 4. Handle Dynamic Attributes (Pod Profiles)
        Object.entries(dynamicAttr).forEach(([key, profileId]) => {
            const profile = podProfiles.find(p => p.id === profileId);
            if (profile && profile.config) {
                try {
                    const config = typeof profile.config === 'string' ? JSON.parse(profile.config) : profile.config;
                    result.spec[key] = config;
                } catch (e) {
                    result.spec[key] = { error: `Failed to parse ${key} config` };
                }
            }
        });

        return yaml.dump(result, { sortKeys: false });
    }, [loading, containers, metadataProfiles, podProfiles, selectedContainerIds, selectedMetadataId, dynamicAttr]);

    const structuredData = useMemo(() => {
        if (loading) return null;

        // Build containers array with their details
        const containersData = selectedContainerIds.map((id: number) => {
            const container = containers[id];
            return container ? {
                id,
                name: container.name,
                image: container.image,
                type: container.type
            } : null;
        }).filter(Boolean);

        return {
            name: (formValues.name as string) || "Unnamed Pod",
            namespace: namespace as string,
            service_account_name: formValues.service_account_name as string,
            host_network: formValues.host_network as boolean,
            dns_policy: formValues.dns_policy as string,
            metadata_profile: selectedMetadataId ? (metadataProfiles[selectedMetadataId] as any) : undefined,
            dynamic_attr: Object.entries(dynamicAttr).reduce((acc, [key, id]) => {
                const profile = podProfiles.find(p => p.id === id);
                if (profile) acc[key] = profile;
                return acc;
            }, {} as any),
            containers: containersData
        };
    }, [loading, formValues, namespace, selectedMetadataId, metadataProfiles, dynamicAttr, podProfiles, selectedContainerIds, containers]);

    return (
        <div className="flex-1 h-[440px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <Tabs
                    variant="pill"
                    tabs={[
                        { id: "overview", label: "Overview" },
                        { id: "yaml", label: "YAML View" }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === "overview" ? (
                    loading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">
                            Compiling overview...
                        </div>
                    ) : structuredData && (
                        <ResourceDetailView data={structuredData} type="pod" />
                    )
                ) : (
                    <div className="h-full rounded-2xl overflow-hidden border border-border/30">
                        <Editor
                            height="100%"
                            width="100%"
                            defaultLanguage="yaml"
                            value={composedYaml}
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 13,
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                padding: { top: 16, bottom: 16 },
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

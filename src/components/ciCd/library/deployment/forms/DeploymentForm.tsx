import React, { useEffect, useState, useMemo } from "react";
import yaml from "js-yaml";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileSelector } from "@/components/ciCd/library/ProfileSelector";
import { DefaultService } from "@/gingerJs_api_client";
import Editor from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Info, Cpu, Box, Layout, Layers, ExternalLink, List, Settings2, Target, Tag, Puzzle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequiredBadge } from "@/components/docker/network/forms/badges";
import { cn } from "@/libs/utils";
import { Tabs } from "@/components/ui/tabs";
import { ResourceDetailView } from "../../ResourceDetailView";

export const DeploymentForm = ({ control, setValue, watch, namespace }: { control: any; setValue: any; watch: any; namespace: string }) => {
    const selectedPod = watch("pod_id");
    const selectedSelector = watch("selector_id");
    const dynamicAttr = watch("dynamic_attr") || {};

    const [attributeInput, setAttributeInput] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<number[]>([]);
    const [deploymentProfiles, setDeploymentProfiles] = useState<any[]>([]);

    useEffect(() => {
        const fetchDeploymentProfiles = async () => {
            try {
                const data = await DefaultService.apiIntegrationKubernetesLibraryDeploymentProfileGet({ namespace });
                setDeploymentProfiles(data as any[]);
            } catch (error) {
                console.error("Error fetching deployment profiles:", error);
            }
        };
        fetchDeploymentProfiles();
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
        const profile = deploymentProfiles.find(p => p.id === id);
        return profile ? `${profile.name} (${profile.type})` : `ID: ${id}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Basic Configuration */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Basic Configuration</h3>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Deployment Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Deployment name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="replicas"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 opacity-60" /> Replicas <RequiredBadge />
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 1)} />
                                    </FormControl>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="paused"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-background/50 p-2.5 shadow-sm h-10">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 leading-none">Paused Status</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={control}
                            name="min_ready_seconds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1.5 flex items-center gap-1">
                                        Min Ready Secs
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} className="h-8 text-xs" onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="revision_history_limit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1.5 flex items-center gap-1">
                                        Revision Limit
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="10" {...field} className="h-8 text-xs" onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="progress_deadline_seconds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1.5 flex items-center gap-1">
                                        Progress Deadline
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="600" {...field} className="h-8 text-xs" onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Composition */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Puzzle className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Composition</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 opacity-60" /> Selector Profile <RequiredBadge />
                        </FormLabel>
                        <ProfileSelector
                            profileType="deployment_selector"
                            namespace={namespace}
                            selectedIds={selectedSelector ? [selectedSelector] : []}
                            onChange={(ids) => setValue("selector_id", ids[0])}
                            multiple={false}
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            <Box className="h-3.5 w-3.5 opacity-60" /> Derived Pod <RequiredBadge />
                        </FormLabel>
                        <ProfileSelector
                            profileType="pod"
                            namespace={namespace}
                            selectedIds={selectedPod ? [selectedPod] : []}
                            onChange={(ids) => setValue("pod_id", ids[0])}
                            multiple={false}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Configuration (Dynamic Attributes) */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Advanced Profiles</h3>
                </div>
                <p className="text-xs text-muted-foreground font-medium pb-2">
                    Attach additional specifications from Deployment Profiles under specific keys in <code>spec</code>.
                </p>

                {Object.keys(dynamicAttr).length > 0 && (
                    <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
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
                                            const url = `${window.location.pathname}?focusId=${dynamicAttr[key]}&resourceType=deployment_profile&autoOpen=true`;
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

                <div className="flex items-end justify-between w-full gap-4 pt-2">
                    <div className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Attribute Name (e.g., strategy)"
                                value={attributeInput}
                                onChange={(e) => setAttributeInput(e.target.value)}
                                className="h-10 pl-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20"
                            />
                        </div>

                        <div className="flex-1">
                            <ProfileSelector
                                profileType="deployment_profile"
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
                        <p className="text-xs font-bold text-muted-foreground">No advanced profiles configured yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DeploymentAdvancedConfig = ({ control, watch, namespace }: { control: any; watch: any; namespace: string }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [pod, setPod] = useState<any>(null);
    const [selector, setSelector] = useState<any>(null);
    const [deploymentProfiles, setDeploymentProfiles] = useState<any[]>([]);
    const [podContainers, setPodContainers] = useState<any[]>([]);
    const [podMetadataProfiles, setPodMetadataProfiles] = useState<any[]>([]);
    const [podProfiles, setPodProfiles] = useState<any[]>([]);
    const [containerProfiles, setContainerProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const formValues = watch ? watch() : control._formValues;
    const selectedPodId = formValues.pod_id;
    const selectedSelectorId = formValues.selector_id;
    const dynamicAttr = formValues.dynamic_attr || {};
    const dynamicAttrHash = JSON.stringify(dynamicAttr);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedPodId && !selectedSelectorId && !Object.keys(dynamicAttr).length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [pRes, sRes, dpRes] = await Promise.all([
                    selectedPodId ? DefaultService.apiIntegrationKubernetesLibraryPodGet({
                        namespace,
                        ids: String(selectedPodId)
                    } as any) : Promise.resolve([]),
                    selectedSelectorId ? DefaultService.apiIntegrationKubernetesLibraryDeploymentSelectorGet({
                        namespace,
                        ids: String(selectedSelectorId)
                    } as any) : Promise.resolve([]),
                    Object.keys(dynamicAttr).length > 0 ? DefaultService.apiIntegrationKubernetesLibraryDeploymentProfileGet({
                        namespace,
                        ids: Object.values(dynamicAttr).join(',')
                    } as any) : Promise.resolve([])
                ]);

                const foundPod = Array.isArray(pRes) ? (pRes as any[]).find(p => p.id === selectedPodId) : null;
                const foundSelector = Array.isArray(sRes) ? (sRes as any[]).find(s => s.id === selectedSelectorId) : null;

                setPod(foundPod);
                setSelector(foundSelector);
                setDeploymentProfiles(dpRes as any[]);

                if (foundPod) {
                    // Fetch pod sub-resources
                    const [cRes, mRes, ppRes] = await Promise.all([
                        foundPod.containers?.length ? DefaultService.apiIntegrationKubernetesLibraryContainerGet({
                            namespace,
                            ids: foundPod.containers.join(',')
                        } as any) : Promise.resolve([]),
                        foundPod.metadata_profile_id ? DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfileGet({
                            namespace,
                            ids: String(foundPod.metadata_profile_id)
                        } as any) : Promise.resolve([]),
                        foundPod.dynamic_attr && Object.keys(foundPod.dynamic_attr).length ? DefaultService.apiIntegrationKubernetesLibraryPodProfileGet({
                            namespace,
                            ids: Object.values(foundPod.dynamic_attr).join(',')
                        } as any) : Promise.resolve([])
                    ]);

                    setPodContainers(Array.isArray(cRes) ? cRes : []);
                    setPodMetadataProfiles(Array.isArray(mRes) ? mRes : []);
                    setPodProfiles(Array.isArray(ppRes) ? ppRes : []);

                    // Fetch container profiles if any
                    const subProfileIds = (Array.isArray(cRes) ? (cRes as any[]) : []).flatMap(c =>
                        c.dynamic_attr ? Object.values(c.dynamic_attr) : []
                    );

                    if (subProfileIds.length > 0) {
                        const cpRes = await DefaultService.apiIntegrationKubernetesLibraryProfileGet({
                            namespace,
                            ids: Array.from(new Set(subProfileIds)).join(',')
                        } as any);
                        setContainerProfiles(Array.isArray(cpRes) ? cpRes : []);
                    }
                }
            } catch (error) {
                console.error("Error fetching preview data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [namespace, selectedPodId, selectedSelectorId, dynamicAttrHash]);

    const composedYaml = useMemo(() => {
        if (loading) return "Loading preview...";

        const parseConfig = (config: any) => {
            if (!config) return {};
            if (typeof config === 'object') return config;
            try {
                return JSON.parse(config);
            } catch (e) {
                return { error: "Failed to parse config", raw: config };
            }
        };

        const selectorConfig = parseConfig(selector?.config);

        const result: any = {
            metadata: {
                name: formValues.name || "unnamed-deployment",
                namespace: namespace
            },
            spec: {
                replicas: formValues.replicas || 1,
                selector: selectorConfig,
                template: {
                    metadata: {
                        labels: selectorConfig.matchLabels || {}
                    },
                    spec: {
                        containers: []
                    }
                }
            }
        };

        // Resolve Pod settings into template.spec
        if (pod) {
            // 1. Handle Pod Metadata Profile
            if (pod.metadata_profile_id) {
                const metaProfile = podMetadataProfiles.find(m => m.id === pod.metadata_profile_id);
                if (metaProfile?.config) {
                    const config = parseConfig(metaProfile.config);
                    Object.assign(result.spec.template.metadata, config);
                }
            }

            // 2. Handle Pod Settings
            if (pod.service_account_name) result.spec.template.spec.serviceAccountName = pod.service_account_name;
            if (pod.host_network !== undefined) result.spec.template.spec.hostNetwork = pod.host_network;
            if (pod.dns_policy) result.spec.template.spec.dnsPolicy = pod.dns_policy;

            // 3. Handle Pod Containers
            pod.containers?.forEach((id: number) => {
                const container = podContainers.find(c => c.id === id);
                if (container) {
                    const cSpec: any = {
                        name: container.name,
                        image: "<IMAGE_FILLED_AT_RUNTIME>",
                        imagePullPolicy: container.image_pull_policy || "IfNotPresent",
                    };

                    if (container.command?.length) cSpec.command = container.command;
                    if (container.args?.length) cSpec.args = container.args;
                    if (container.working_dir) cSpec.workingDir = container.working_dir;

                    // Merge container profiles
                    if (container.dynamic_attr) {
                        Object.entries(container.dynamic_attr).forEach(([key, profileId]) => {
                            const profile = containerProfiles.find(p => p.id === (profileId as any));
                            if (profile?.config) {
                                cSpec[key] = parseConfig(profile.config);
                            }
                        });
                    }
                    result.spec.template.spec.containers.push(cSpec);
                }
            });

            // 4. Handle Pod Dynamic Attributes (Profiles)
            if (pod.dynamic_attr) {
                Object.entries(pod.dynamic_attr).forEach(([key, profileId]) => {
                    const profile = podProfiles.find(p => p.id === (profileId as any));
                    if (profile?.config) {
                        result.spec.template.spec[key] = parseConfig(profile.config);
                    }
                });
            }
        }

        if (formValues.paused) result.spec.paused = true;
        if (formValues.progress_deadline_seconds) result.spec.progressDeadlineSeconds = formValues.progress_deadline_seconds;
        if (formValues.revision_history_limit) result.spec.revisionHistoryLimit = formValues.revision_history_limit;
        if (formValues.min_ready_seconds) result.spec.minReadySeconds = formValues.min_ready_seconds;

        // Merge deployment profiles into spec
        Object.entries(dynamicAttr).forEach(([key, profileId]) => {
            const profile = deploymentProfiles.find(p => p.id === profileId);
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
    }, [loading, pod, selector, deploymentProfiles, podContainers, podMetadataProfiles, podProfiles, containerProfiles, formValues, namespace, dynamicAttr]);

    const structuredData = useMemo(() => {
        if (loading) return null;

        return {
            name: (formValues.name as string) || "Unnamed Deployment",
            namespace: namespace as string,
            replicas: formValues.replicas || 1,
            paused: formValues.paused,
            min_ready_seconds: formValues.min_ready_seconds,
            revision_history_limit: formValues.revision_history_limit,
            progress_deadline_seconds: formValues.progress_deadline_seconds,
            selector: selector ? selector : undefined,
            pod: pod ? pod : undefined,
            dynamic_attr: Object.entries(dynamicAttr).reduce((acc, [key, id]) => {
                const profile = deploymentProfiles.find(p => p.id === id);
                if (profile) acc[key] = profile;
                return acc;
            }, {} as any),
        };
    }, [loading, formValues, namespace, selector, pod, dynamicAttr, deploymentProfiles]);

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
                        <ResourceDetailView data={structuredData} type="deployment" />
                    )
                ) : (
                    <div className="h-full rounded-xl overflow-hidden border border-border/30">
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

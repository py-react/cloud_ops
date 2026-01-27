import React, { useEffect, useState, useMemo } from "react";
import yaml from "js-yaml";
import { DefaultService } from "@/gingerJs_api_client";
import Editor from "@monaco-editor/react";
import { Network, Layout as LayoutIcon } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ResourceDetailView } from "../../ResourceDetailView";

export const ServiceAdvancedConfig = ({ watch, namespace }: { watch: any; namespace: string }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [metadataProfile, setMetadataProfile] = useState<any>(null);
    const [selectorProfile, setSelectorProfile] = useState<any>(null);
    const [dynamicProfiles, setDynamicProfiles] = useState<Record<number, any>>({});

    const name = watch("name");
    const metadataProfileId = watch("metadata_profile_id");
    const selectorProfileId = watch("selector_profile_id");
    const dynamicAttr = watch("dynamic_attr") || {};
    const dynamicAttrStr = JSON.stringify(dynamicAttr);

    useEffect(() => {
        const fetchData = async () => {
            if (!metadataProfileId && !selectorProfileId && !Object.keys(dynamicAttr).length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const dynamicIds = Object.values(dynamicAttr).map(v => String(v)).filter(v => v && v !== 'null' && v !== 'undefined').join(',');

                const [mRes, selRes, dRes] = await Promise.all([
                    metadataProfileId ? DefaultService.apiIntegrationKubernetesLibraryServiceMetadataGet({ namespace, ids: String(metadataProfileId) } as any) : Promise.resolve([]),
                    selectorProfileId ? DefaultService.apiIntegrationKubernetesLibraryServiceSelectorGet({ namespace, ids: String(selectorProfileId) } as any) : Promise.resolve([]),
                    dynamicIds ? DefaultService.apiIntegrationKubernetesLibraryServiceProfileGet({ namespace, ids: dynamicIds } as any) : Promise.resolve([])
                ]);

                if (Array.isArray(mRes) && mRes.length > 0) setMetadataProfile(mRes[0]);
                else if (mRes && !Array.isArray(mRes)) setMetadataProfile(mRes);

                if (Array.isArray(selRes) && selRes.length > 0) setSelectorProfile(selRes[0]);
                else if (selRes && !Array.isArray(selRes)) setSelectorProfile(selRes);

                const dMap: Record<number, any> = {};
                if (Array.isArray(dRes)) {
                    dRes.forEach(p => { dMap[p.id] = p; });
                } else if (dRes && typeof dRes === 'object' && 'id' in dRes) {
                    dMap[(dRes as any).id] = dRes;
                }
                setDynamicProfiles(dMap);

            } catch (error) {
                console.error("Error fetching service preview data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [namespace, metadataProfileId, selectorProfileId, dynamicAttrStr]);

    const composedYaml = useMemo(() => {
        if (loading) return "Loading preview...";

        const result: any = {
            apiVersion: "v1",
            kind: "Service",
            metadata: {
                name: name || "example-service",
                namespace: namespace
            },
            spec: {}
        };

        // 1. Metadata merging
        if (metadataProfile && metadataProfile.config) {
            try {
                const metaConfig = typeof metadataProfile.config === 'string' ? JSON.parse(metadataProfile.config) : metadataProfile.config;
                result.metadata = { ...metaConfig, ...result.metadata };
            } catch (e) {
                result.metadata.error = "Failed to parse metadata config";
            }
        }

        // 2. Selector merging
        if (selectorProfile && selectorProfile.config) {
            try {
                const selectorConfig = typeof selectorProfile.config === 'string' ? JSON.parse(selectorProfile.config) : selectorProfile.config;
                result.spec.selector = selectorConfig;
            } catch (e) {
                result.spec.selector = { error: "Failed to parse selector config" };
            }
        }


        // 4. Dynamic Attributes merging into spec
        Object.entries(dynamicAttr).forEach(([key, profileId]: [string, any]) => {
            const profile = dynamicProfiles[profileId];
            if (profile && profile.config) {
                try {
                    const config = typeof profile.config === 'string' ? JSON.parse(profile.config) : profile.config;
                    // If it's a dynamic attribute, we often want to merge it or nest it
                    // Usually it's nested under the key provided
                    result.spec[key] = config;
                } catch (e) {
                    result.spec[key] = { error: `Failed to parse ${key} config` };
                }
            }
        });

        return yaml.dump(result, { sortKeys: false });
    }, [loading, name, namespace, metadataProfile, selectorProfile, dynamicAttr, dynamicProfiles]);

    const structuredData = useMemo(() => {
        if (loading) return null;
        return {
            name: name || "Unnamed Service",
            namespace: namespace,
            service_profile: undefined,
            metadata_profile: metadataProfile,
            selector_profile: selectorProfile,
            dynamic_attr: Object.entries(dynamicAttr).reduce((acc, [key, id]) => {
                const profile = dynamicProfiles[id as number];
                if (profile) acc[key] = profile;
                return acc;
            }, {} as any),
        };
    }, [loading, name, namespace, metadataProfile, selectorProfile, dynamicAttr, dynamicProfiles]);

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
                        <ResourceDetailView data={structuredData} type="service" />
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

import React, { useState, useMemo } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import { Tabs } from "@/components/ui/tabs";
import { ProfileDetailView } from "../../ProfileDetailView";

interface ProfileAdvancedConfigProps {
    profile: {
        id?: number;
        name: string;
        type: string;
        namespace: string;
        config: any;
    };
    profileType: "pod_profile" | "pod_metadata_profile" | "service_profile" | "service_metadata_profile" | "service_selector_profile" | "profile" | "httproute" | "httproute_metadata_profile" | "httproute_rules_profile" | "httproute_parent_refs_profile" | "httproute_hostnames_profile";
}

export const ProfileAdvancedConfig: React.FC<ProfileAdvancedConfigProps> = ({ profile, profileType }) => {
    const [activeTab, setActiveTab] = useState("overview");

    // Parse config and convert to YAML
    const yamlConfig = useMemo(() => {
        if (!profile.config) return "# No configuration available";

        let configObj: any;
        if (typeof profile.config === 'string') {
            try {
                configObj = JSON.parse(profile.config);
            } catch (e) {
                // If it's not valid JSON, try to parse as YAML
                try {
                    configObj = yaml.load(profile.config);
                } catch (e2) {
                    return "# Invalid configuration format";
                }
            }
        } else {
            configObj = profile.config;
        }

        if (profileType === "httproute" && configObj) {
            // Reconstruct standard Kubernetes HTTPRoute YAML
            const httpRouteYaml: any = {
                apiVersion: "gateway.networking.k8s.io/v1",
                kind: "HTTPRoute",
                metadata: {
                    name: profile.name,
                    namespace: profile.namespace,
                },
                spec: {}
            };

            // Parse metadata profile limits (labels/annotations)
            if (configObj.metadata_profile?.config) {
                try {
                    const metaConfig = typeof configObj.metadata_profile.config === 'string'
                        ? JSON.parse(configObj.metadata_profile.config)
                        : configObj.metadata_profile.config;
                    if (metaConfig.labels) httpRouteYaml.metadata.labels = metaConfig.labels;
                    if (metaConfig.annotations) httpRouteYaml.metadata.annotations = metaConfig.annotations;
                } catch (e) { }
            }

            // Parse ParentRefs
            if (configObj.parent_refs_profile?.config) {
                try {
                    const parentRefsConfig = typeof configObj.parent_refs_profile.config === 'string'
                        ? JSON.parse(configObj.parent_refs_profile.config)
                        : configObj.parent_refs_profile.config;
                    if (Array.isArray(parentRefsConfig)) {
                        httpRouteYaml.spec.parentRefs = parentRefsConfig;
                    } else if (parentRefsConfig.parentRefs) {
                        httpRouteYaml.spec.parentRefs = parentRefsConfig.parentRefs;
                    }
                } catch (e) { }
            }

            // Parse Hostnames
            let hostnames: string[] = [];
            if (configObj.hostnames_profile?.config) {
                try {
                    const hostnamesConfig = typeof configObj.hostnames_profile.config === 'string'
                        ? JSON.parse(configObj.hostnames_profile.config)
                        : configObj.hostnames_profile.config;
                    if (Array.isArray(hostnamesConfig)) {
                        hostnames = hostnamesConfig;
                    } else if (hostnamesConfig.hostnames && Array.isArray(hostnamesConfig.hostnames)) {
                        hostnames = hostnamesConfig.hostnames;
                    }
                } catch (e) { }
            }
            if (hostnames.length > 0) {
                httpRouteYaml.spec.hostnames = hostnames;
            }

            // Parse Rules
            if (configObj.rules_profile?.config) {
                try {
                    const rulesConfig = typeof configObj.rules_profile.config === 'string'
                        ? JSON.parse(configObj.rules_profile.config)
                        : configObj.rules_profile.config;
                    if (Array.isArray(rulesConfig)) {
                        httpRouteYaml.spec.rules = rulesConfig;
                    } else if (rulesConfig.rules && Array.isArray(rulesConfig.rules)) {
                        httpRouteYaml.spec.rules = rulesConfig.rules;
                    }
                } catch (e) { }
            }

            try {
                return yaml.dump(httpRouteYaml, { sortKeys: false });
            } catch (e) {
                return "# Error converting to YAML";
            }
        }

        try {
            return yaml.dump(configObj, { sortKeys: false });
        } catch (e) {
            return "# Error converting to YAML";
        }
    }, [profile, profileType]);

    const structuredData = useMemo(() => {
        return {
            name: profile.name,
            type: profile.type,
            namespace: profile.namespace,
            config: profile.config
        };
    }, [profile]);

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
                    <ProfileDetailView data={structuredData} profileType={profileType} />
                ) : (
                    <div className="h-full rounded-2xl overflow-hidden border border-border/30">
                        <Editor
                            height="100%"
                            width="100%"
                            defaultLanguage="yaml"
                            value={yamlConfig}
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


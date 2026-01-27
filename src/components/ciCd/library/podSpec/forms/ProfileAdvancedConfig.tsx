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
    profileType: "pod_profile" | "pod_metadata_profile" | "service_profile" | "service_metadata_profile" | "service_selector_profile" | "profile";
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

        try {
            return yaml.dump(configObj, { sortKeys: false });
        } catch (e) {
            return "# Error converting to YAML";
        }
    }, [profile.config]);

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


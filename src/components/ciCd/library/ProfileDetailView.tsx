import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    FileText,
    Code,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileDetailViewProps {
    data: {
        name: string;
        type: string;
        namespace: string;
        config: any;
    };
    profileType: "pod_profile" | "pod_metadata_profile" | "service_profile" | "service_metadata_profile" | "service_selector_profile" | "profile";
}

export const ProfileDetailView: React.FC<ProfileDetailViewProps> = ({ data, profileType }) => {
    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 pb-2 border-b border-border/30 mb-4 mt-6 first:mt-0">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">{title}</span>
        </div>
    );

    const InfoItem = ({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => {
        if (value === undefined || value === null || value === "") return null;
        return (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{String(value)}</span>
            </div>
        );
    };

    // Parse config if it's a string
    const parsedConfig = React.useMemo(() => {
        if (!data.config) return null;
        if (typeof data.config === 'string') {
            try {
                return JSON.parse(data.config);
            } catch (e) {
                return null;
            }
        }
        return data.config;
    }, [data.config]);

    return (
        <ScrollArea className="h-[440px] pr-4">
            <div className="space-y-4 pb-6">

                {/* Profile Information */}
                <SectionHeader icon={Settings} title="Profile Information" />
                <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Name" value={data.name} icon={FileText} />
                    <InfoItem label="Type" value={data.type} icon={Settings} />
                    <InfoItem label="Namespace" value={data.namespace} icon={FileText} />
                </div>

                {/* Configuration */}
                {parsedConfig && (
                    <>
                        <SectionHeader icon={Code} title="Configuration" />
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                            <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                {JSON.stringify(parsedConfig, null, 2)}
                            </pre>
                        </div>
                    </>
                )}

                {!parsedConfig && (
                    <div className="p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
                        <Code className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground">No configuration available</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};


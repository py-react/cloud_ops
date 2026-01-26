import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Cpu,
    Box,
    ExternalLink,
    Layout,
    Container,
    FileText,
    Terminal,
    Command,
    Settings,
    User,
    Shield,
    Globe,
    Zap
} from "lucide-react";
import { cn } from "@/libs/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ResourceType } from "@/hooks/useResourceLink";

interface ProfileInfo {
    id: number;
    name: string;
    type: string;
}

interface ResourceDetailViewProps {
    data: {
        name: string;
        description?: string;
        namespace: string;
        // Pod Specific
        metadata_profile?: ProfileInfo;
        dynamic_attr?: Record<string, ProfileInfo>;
        service_account_name?: string;
        host_network?: boolean;
        dns_policy?: string;
        tty?: boolean;
        stdin?: boolean;
        containers?: Array<{ id: number; name: string; image?: string; type?: string }>;
        // Container Specific
        image?: string;
        image_pull_policy?: string;
        command?: string[];
        args?: string[];
        working_dir?: string;
    };
    type: "pod" | "container";
}

export const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({ data, type }) => {
    const handleOpenProfile = (id: number, resourceType: ResourceType) => {
        // Extract namespace from current path
        const pathParts = window.location.pathname.split('/');
        const namespaceIndex = pathParts.findIndex(part => part === 'library') + 1;
        const namespace = pathParts[namespaceIndex] || 'default';

        // Build the correct path based on resource type
        let targetPath = '';
        switch (resourceType) {
            case 'pod_profile':
                targetPath = `/settings/ci_cd/library/${namespace}/spec/pod/profile`;
                break;
            case 'pod_metadata_profile':
                targetPath = `/settings/ci_cd/library/${namespace}/spec/pod/metadata`;
                break;
            case 'profile':
                targetPath = `/settings/ci_cd/library/${namespace}/spec/container/profile`;
                break;
            case 'container':
                targetPath = `/settings/ci_cd/library/${namespace}/spec/container`;
                break;
            case 'pod':
                targetPath = `/settings/ci_cd/library/${namespace}/spec/pod`;
                break;
            default:
                targetPath = window.location.pathname;
        }

        const url = `${targetPath}?focusId=${id}&resourceType=${resourceType}&autoOpen=true`;
        window.open(url, "_blank");
    };

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

    return (
        <ScrollArea className="h-[440px] pr-4">
            <div className="space-y-4 pb-6">

                {/* Pod Specific Config */}
                {type === "pod" && (
                    <>
                        <SectionHeader icon={Box} title="Derived Pod Settings" />
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <InfoItem label="Name" value={data.name} icon={FileText} />
                        </div>

                        <SectionHeader icon={Shield} title="Security & Network" />
                        <div className="grid grid-cols-2 gap-3">
                            <InfoItem label="Service Account" value={data.service_account_name} icon={User} />
                            <InfoItem label="DNS Policy" value={data.dns_policy} icon={Globe} />
                            <InfoItem label="Host Network" value={data.host_network !== undefined ? (data.host_network ? "Enabled" : "Disabled") : undefined} icon={Zap} />
                        </div>

                        {data.metadata_profile && (
                            <>
                                <SectionHeader icon={Layout} title="Metadata Profile" />
                                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tight">Active Metadata Profile</span>
                                        <span className="text-xs font-bold text-foreground mt-0.5">{data.metadata_profile.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleOpenProfile(data.metadata_profile!.id, "pod_metadata_profile")}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-[10px] font-bold uppercase">Inspect</span>
                                    </Button>
                                </div>
                            </>
                        )}
                        {data.containers && data.containers.length > 0 && (
                            <>
                                <SectionHeader icon={Container} title="Derived Containers" />
                                <div className="grid grid-cols-1 gap-3">
                                    {data.containers.map((container) => (
                                        <div key={container.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between group">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-foreground">{container.name}</span>
                                                {container.image && (
                                                    <span className="text-[10px] text-muted-foreground font-mono">{container.image}</span>
                                                )}
                                                {container.type && (
                                                    <Badge variant="outline" className="w-fit h-5 text-[9px] font-bold uppercase border-blue-500/30 tracking-widest text-blue-600">
                                                        {container.type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleOpenProfile(container.id, "container")}
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                <span className="text-[10px] font-bold uppercase">Inspect</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Container Specific Config */}
                {type === "container" && (
                    <>
                        <SectionHeader icon={Box} title="Derived Container Settings" />
                        <div className="grid grid-cols-2 gap-3">
                            <InfoItem label="Name" value={data.name} icon={FileText} />
                            <InfoItem label="Image" value={data.image || "<NAME_AT_RUNTIME>"} icon={Box} />
                            <InfoItem label="Pull Policy" value={data.image_pull_policy} icon={RefreshCw} />
                            <InfoItem label="Working Dir" value={data.working_dir} icon={FileText} />
                            <div className="flex items-center gap-6 mt-1 px-4 py-3 rounded-xl bg-background/40 border border-border/20 col-span-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">TTY:</span>
                                    <Badge variant={data.tty ? "success" : "secondary"} className="h-6 text-[10px] px-2.5 font-bold uppercase tracking-wider">
                                        {data.tty ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 border-l border-border/40 pl-6">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Interactive (Stdin):</span>
                                    <Badge variant={data.stdin ? "success" : "secondary"} className="h-6 text-[10px] px-2.5 font-bold uppercase tracking-wider">
                                        {data.stdin ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {data.command && data.command.length > 0 && (
                            <>
                                <SectionHeader icon={FileTerminal} title="Entrypoint (Command)" />
                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
                                    {data.command.map((cmd, i) => (
                                        <code key={i} className="px-2 py-1 rounded bg-background border border-border/50 text-[11px] font-mono font-bold text-primary">
                                            {cmd}
                                        </code>
                                    ))}
                                </div>
                            </>
                        )}

                        {data.args && data.args.length > 0 && (
                            <>
                                <SectionHeader icon={Terminal} title="Arguments" />
                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
                                    {data.args.map((arg, i) => (
                                        <code key={i} className="px-2 py-1 rounded bg-background border border-border/50 text-[11px] font-mono font-bold text-primary">
                                            {arg}
                                        </code>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Dynamic Attributes / Profiles */}
                {data.dynamic_attr && Object.keys(data.dynamic_attr).length > 0 && (
                    <>
                        <SectionHeader icon={Cpu} title="Dynamic Attributes" />
                        <div className="grid grid-cols-1 gap-3">
                            {Object.entries(data.dynamic_attr).map(([key, profile]) => (
                                <div key={key} className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">{key}</span>
                                            <span className="text-sm font-black text-foreground">{profile.name}</span>
                                        </div>
                                        <Badge variant="outline" className="h-5 text-[9px] font-bold uppercase border-primary/30 tracking-widest text-primary/60">
                                            {profile.type}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleOpenProfile(profile.id, type === "container" ? "pod_profile" : "pod_profile")} // Note: container spec uses general profile
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 mr-1 text-primary" />
                                        <span className="text-[10px] font-bold uppercase text-primary">Inspect</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </ScrollArea>
    );
};

// Supporting Components for internal use
const RefreshCw = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

const FileTerminal = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m3 10 2.5-2.5L3 5" />
        <path d="m3 19 2.5-2.5L3 14" />
        <path d="M7 8h14" />
        <path d="M7 17h14" />
        <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
);

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Box, Calendar, Cpu, HardDrive, Layers, Tag, FileCode, Monitor, File, Folder, Info } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { toast } from "sonner";
import useNavigate from "@/libs/navigate";
import { Badge } from "@/components/ui/badge";
import Editor from "@monaco-editor/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-v2";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";

interface PackageDetail {
    package: {
        id: string;
        name: string[];
        tags: string[];
        created: string;
        size: number;
        virtual_size: number;
        repo_tags: string[];
        labels: Record<string, string>;
        os: string;
        architecture: string;
        author: string;
        config: any;
        root_fs: any;
    };
    history: {
        id: string;
        created: number;
        created_by: string;
        tags: string[];
        size: number;
        comment: string;
    }[];
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (timestamp: number | string) => {
    if (!timestamp) return "N/A";
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return date.toLocaleString();
};

const extractFileOperations = (command: string) => {
    const cmd = command.replace('/bin/sh -c #(nop) ', '').trim();
    const parts = cmd.split(' ');
    const type = parts[0];

    if (type === 'COPY' || type === 'ADD') {
        const remaining = parts.slice(1).join(' ');
        const destMatch = cmd.match(/in\s+(.+)$/);

        let displayFile = remaining;
        if (destMatch) {
            displayFile = destMatch[1];
        } else {
            if (parts.length >= 3) {
                displayFile = parts[parts.length - 1];
            }
        }

        return {
            type: type,
            files: [displayFile],
            description: `Copied to ${displayFile}`
        };
    }

    if (type === 'WORKDIR') {
        return {
            type: 'WORKDIR',
            files: [parts[1]],
            description: `Set working directory`
        };
    }

    if (cmd.startsWith("CMD") || cmd.startsWith("ENTRYPOINT")) {
        return {
            type: 'EXEC',
            files: [],
            description: `Configuration change`
        }
    }

    if (type === 'ENV') {
        return {
            type: 'ENV',
            files: [],
            description: `Set environment variable`
        }
    }

    return null;
};


const PackageDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<PackageDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchPackageDetails(id);
        }
    }, [id]);

    const fetchPackageDetails = async (packageId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/docker/packages?id=${packageId}`);
            const result = await res.json();
            if (result.error) {
                toast.error(result.message);
            } else {
                setData(result);
                // Automatically select the first layer (which is usually the latest)
                if (result.history && result.history.length > 0) {
                    setSelectedLayer(result.history[0]);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load package details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Loading..." icon={Box}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </PageLayout>
        );
    }

    if (!data) {
        return (
            <PageLayout title="Not Found" icon={Box}>
                <div className="text-center">Package not found</div>
            </PageLayout>
        );
    }

    const pkg = data.package;
    const history = data.history;

    const layerColumns = [
        { header: "Layer ID", accessor: "id", cell: (row: any) => <span title={row.id} className="font-mono text-xs">{row.id === "missing" ? "<missing>" : row.id.substring(0, 12)}</span> },
        {
            header: "Command",
            accessor: "created_by",
            cell: (row: any) => (
                <div className="max-w-2xl truncate font-mono text-xs text-muted-foreground" title={row.created_by}>
                    {row.created_by.replace('/bin/sh -c #(nop) ', '') || row.created_by}
                </div>
            )
        },
        { header: "Size", accessor: "size", cell: (row: any) => formatSize(row.size) },
        { header: "Created", accessor: "created", cell: (row: any) => formatDate(row.created) },
    ];

    const configJson = JSON.stringify(pkg.config, null, 2);

    return (
        <PageLayout
            title={pkg.tags && pkg.tags.length > 0 ? pkg.tags[0] : (pkg.name[0] !== "None" ? pkg.name[0] : pkg.id.substring(0, 12))}
            subtitle={pkg.id}
            icon={Box}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ResourceCard
                    title="Size"
                    count={formatSize(pkg.size).split(" ")[0]}
                    unit={formatSize(pkg.size).split(" ")[1]}
                    icon={<HardDrive className="w-4 h-4" />}
                    color="bg-blue-500"
                />
                <ResourceCard
                    title="Architecture"
                    count={pkg.architecture}
                    icon={<Cpu className="w-4 h-4" />}
                    color="bg-purple-500"
                />
                <ResourceCard
                    title="OS"
                    count={pkg.os}
                    icon={<Monitor className="w-4 h-4" />}
                    color="bg-green-500"
                />
                <ResourceCard
                    title="Format"
                    count="Docker"
                    icon={<Box className="w-4 h-4" />}
                    color="bg-orange-500"
                />
            </div>

            <Tabs defaultValue="layers" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="layers" className="gap-2"><Layers className="w-4 h-4" /> Layers</TabsTrigger>
                    <TabsTrigger value="info" className="gap-2"><Tag className="w-4 h-4" /> Metadata</TabsTrigger>
                    <TabsTrigger value="config" className="gap-2"><FileCode className="w-4 h-4" /> Config</TabsTrigger>
                </TabsList>

                <TabsContent value="layers" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Layers Table Column */}
                        <Card className="border-border/40 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    Image Layers
                                </CardTitle>
                                <CardDescription>Select a layer to inspect details and file changes.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="px-4 py-2 bg-muted/20 border-b border-border/40 text-xs text-muted-foreground flex gap-2 items-center">
                                    <Info className="w-3.5 h-3.5" />
                                    <span>Layers with ID <code>&lt;missing&gt;</code> are intermediate.</span>
                                </div>
                                <ResourceTable
                                    columns={layerColumns}
                                    data={history}
                                    className="border-0 shadow-none"
                                    onViewDetails={(row) => setSelectedLayer(row)}
                                    onRowClick={(row) => setSelectedLayer(row)}
                                />
                            </CardContent>
                        </Card>

                        {/* Layer Inspection Column */}
                        <div className="lg:col-span-1 space-y-4 sticky top-4">
                            <Card className="border-border/40 shadow-sm h-full max-h-[calc(100vh-200px)] overflow-hidden flex flex-col">
                                <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-primary" />
                                        Layer Inspection
                                    </CardTitle>
                                    {selectedLayer && (
                                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate" title={selectedLayer.id}>
                                            {selectedLayer.id === "missing" ? "<missing>" : selectedLayer.id}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {selectedLayer ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Created At</span>
                                                    <span className="font-mono text-xs">{formatDate(selectedLayer.created)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Size</span>
                                                    <span className="font-mono text-xs">{formatSize(selectedLayer.size)}</span>
                                                </div>
                                            </div>

                                            {/* Inferred File Operations */}
                                            {(() => {
                                                const ops = extractFileOperations(selectedLayer.created_by);
                                                if (ops && (ops.type === 'COPY' || ops.type === 'ADD' || ops.type === 'WORKDIR')) {
                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inferred Changes</span>
                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 py-0">{ops.type}</Badge>
                                                            </div>
                                                            <div className="rounded-md border border-border/50 bg-muted/20 overflow-hidden">
                                                                {ops.files.map((file, i) => (
                                                                    <div key={i} className="flex items-center gap-2 p-2 px-3 border-b border-border/40 last:border-0">
                                                                        {ops.type === 'WORKDIR' ? <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <File className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-xs font-medium font-mono truncate cursor-help" title={file}>{file}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            })()}

                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Command</span>
                                                <div className="rounded-md border border-border/50 bg-muted/30 p-3">
                                                    <code className="text-[11px] font-mono break-all whitespace-pre-wrap leading-relaxed text-foreground/90 block">
                                                        {selectedLayer.created_by.replace('/bin/sh -c #(nop) ', '') || selectedLayer.created_by}
                                                    </code>
                                                </div>
                                            </div>

                                            {selectedLayer.comment && (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Comment</span>
                                                    <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">{selectedLayer.comment}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground space-y-2">
                                            <Layers className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">Select a layer to view details</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="info" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-border/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {pkg.repo_tags && pkg.repo_tags.length > 0 ? (
                                        pkg.repo_tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="font-mono">{tag}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No repository tags</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Labels</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(pkg.labels).length > 0 ? (
                                        Object.entries(pkg.labels).map(([key, value]) => (
                                            <Badge key={key} variant="outline" className="font-mono text-xs">
                                                {key}={String(value)}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No labels</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 shadow-sm md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                                    <div>
                                        <dt className="font-medium text-muted-foreground">ID</dt>
                                        <dd className="font-mono mt-1 break-all">{pkg.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-muted-foreground">Created</dt>
                                        <dd className="mt-1">{formatDate(pkg.created)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-muted-foreground">Author</dt>
                                        <dd className="mt-1">{pkg.author}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-muted-foreground">Virtual Size</dt>
                                        <dd className="mt-1">{formatSize(pkg.virtual_size)}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                    <Card className="border-border/40 shadow-sm h-[600px] overflow-hidden">
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            value={configJson}
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 13,
                                wordWrap: 'on',
                                automaticLayout: true,
                            }}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
};

export default PackageDetails;

import React, { useState, useEffect } from 'react';
import {
    Box, Settings, Github, Save, RefreshCw, Send, Shield, Globe,
    Info, AlertCircle, CheckCircle2, History, Undo, Search,
    Calendar, User, Hash, FileText, Loader2, ChevronRight, CloudUpload,
    ExternalLink, MapPin, Activity
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CommitDialog } from '@/components/library/CommitDialog';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { FormWizard } from "@/components/wizard/form-wizard";
import * as z from 'zod';
import { getGitOpsSteps } from '@/components/library/forms/GitOpsSteps';
import Editor from '@monaco-editor/react';
import { HelmErrorState } from '@/components/kubernetes/helm/HelmErrorState';

interface HistoryItem {
    hash: string;
    author: string;
    date: string;
    message: string;
}

const gitOpsSchema = z.object({
    repo_name: z.string().min(1, "Repository name is required"),
    repo_owner: z.string().min(1, "Repository owner is required"),
    branch: z.string().default("main"),
    github_credential_id: z.number({ required_error: "GitHub credential is required" }),
    auto_push: z.boolean().default(false)
});

export default function ChartsSettingsPage() {
    // Settings state
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        repo_name: '',
        repo_owner: '',
        branch: 'main',
        github_credential_id: null as number | null,
        auto_push: false
    });
    const [credentials, setCredentials] = useState<any[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [reverting, setReverting] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<HistoryItem | null>(null);
    const [revertDialogOpen, setRevertDialogOpen] = useState(false);

    // Conflict state
    const [conflictStatus, setConflictStatus] = useState<{ has_conflicts: boolean; files: string[]; is_merging: boolean } | null>(null);
    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [currentConflictFile, setCurrentConflictFile] = useState<string | null>(null);
    const [conflictFileContent, setConflictFileContent] = useState('');
    const [resolving, setResolving] = useState(false);

    // Diff view state
    const [diffModalOpen, setDiffModalOpen] = useState(false);
    const [diffContent, setDiffContent] = useState('');
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [commitDialogOpen, setCommitDialogOpen] = useState(false);

    // Wizard state
    const [isConfigWizardOpen, setIsConfigWizardOpen] = useState(false);
    const [currentWizardStep, setCurrentWizardStep] = useState('repository');
    const [helmError, setHelmError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/system/install?tool=helm')
            .then(res => res.json())
            .then(data => {
                if (!data.error && data.is_installed === false) {
                    setHelmError("Helm must be installed to manage chart configurations.");
                }
            })
            .catch(() => {});
            
        fetchData();
        fetchHistory();
        checkConflicts(); // Auto-open resolver if in conflict state
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsRes, credentialsRes] = await Promise.all([
                fetch('/api/library/settings'),
                fetch('/api/integration/credentials') // Using the correct endpoint found in the previous view_file
            ]);

            const settingsData = await settingsRes.json();
            const credentialsData = await credentialsRes.json();

            if (settingsData.data) {
                setSettings(settingsData.data);
            }
            if (Array.isArray(credentialsData)) {
                setCredentials(credentialsData.filter((c: any) => c.provider === 'github'));
            }
        } catch (e) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await fetch('/api/library/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.data || []);
            }
        } catch (e) {
            toast.error("Failed to load audit history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        try {
            setSaving(true);
            const res = await fetch('/api/library/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                toast.success("Settings saved successfully");
                setSettings(data);
                setIsConfigWizardOpen(false);
            } else {
                toast.error("Failed to save settings");
            }
        } catch (e) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const handlePush = async () => {
        try {
            setPushing(true);
            const res = await fetch('/api/library/settings/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'continue' }) // Use continue-sync logic which includes push
            });
            const data = await res.json();

            if (data.status === 'success') {
                toast.success("Library synchronized successfully");
                setConflictStatus(null);
                setConflictModalOpen(false);
                fetchHistory();
            } else if (data.status === 'conflict') {
                toast.warning("Merge conflict detected! Resolution required.");
                checkConflicts();
            } else {
                toast.error(data.message || "Failed to sync to remote");
            }
        } catch (e) {
            toast.error("An error occurred during sync");
        } finally {
            setPushing(false);
        }
    };

    const handlePull = async () => {
        try {
            setPulling(true);
            const res = await fetch('/api/library/settings/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pull' })
            });
            const data = await res.json();

            if (data.status === 'success') {
                toast.success("Library updated from remote");
                fetchHistory();
            } else if (data.status === 'conflict') {
                toast.warning("Merge conflict detected! Resolution required.");
                checkConflicts();
            } else {
                toast.error(data.message || "Failed to pull from remote");
            }
        } catch (e) {
            toast.error("An error occurred during pull");
        } finally {
            setPulling(false);
        }
    };

    const checkConflicts = async () => {
        try {
            const res = await fetch('/api/library/settings/sync');
            const data = await res.json();
            if (data.status === 'success' && data.data.has_conflicts) {
                setConflictStatus(data.data);
                setConflictModalOpen(true);
            } else {
                setConflictStatus(null);
            }
        } catch (e) {
            console.error("Failed to check conflicts", e);
        }
    };

    const handleResolveFile = async () => {
        if (!currentConflictFile) return;
        try {
            setResolving(true);
            const res = await fetch('/api/library/settings/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve',
                    file_path: currentConflictFile,
                    content: conflictFileContent
                })
            });
            if (res.ok) {
                toast.success(`Resolved ${currentConflictFile}`);
                const nextFiles = conflictStatus?.files.filter(f => f !== currentConflictFile) || [];
                setConflictStatus(prev => prev ? { ...prev, files: nextFiles } : null);
                setCurrentConflictFile(null);
                if (nextFiles.length === 0) {
                    toast.info("All conflicts resolved. You can now finalize sync.");
                }
            }
        } catch (e) {
            toast.error("Failed to resolve file");
        } finally {
            setResolving(false);
        }
    };

    const handleAbortSync = async () => {
        try {
            await fetch('/api/library/settings/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'abort' })
            });
            toast.info("Sync aborted");
            setConflictModalOpen(false);
            setConflictStatus(null);
        } catch (e) {
            toast.error("Failed to abort sync");
        }
    };

    const handleRevert = async (commit_message: string) => {
        if (!selectedCommit) return;
        try {
            setReverting(true);
            const res = await fetch('/api/library/history/revert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commit_hash: selectedCommit.hash,
                    message: commit_message || `Rollback: Reverted system to ${selectedCommit.hash.substring(0, 8)}`
                })
            });
            if (res.ok) {
                toast.success("System reverted successfully");
                setRevertDialogOpen(false);
                fetchHistory();
            } else {
                toast.error("Failed to revert system");
            }
        } catch (e) {
            toast.error("An error occurred during rollback");
        } finally {
            setReverting(false);
        }
    };

    const handleViewDiff = async (hash: string) => {
        try {
            setLoadingDiff(true);
            setDiffModalOpen(true);
            const res = await fetch(`/api/library/history?commit_hash=${hash}`);
            if (res.ok) {
                const data = await res.json();
                setDiffContent(data.data);
            }
        } catch (e) {
            toast.error("Failed to load diff");
        } finally {
            setLoadingDiff(false);
        }
    };

    const fetchFileContent = async (file: string) => {
        try {
            const res = await fetch(`/api/library/settings/sync/file?file=${file}`);
            if (res.ok) {
                const data = await res.json();
                setConflictFileContent(data.content);
            }
        } catch (e) {
            toast.error("Failed to load file content");
        }
    };

    const filteredHistory = history.filter(item =>
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hash.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const configSteps = getGitOpsSteps(credentials);

    const ConfigSummary = () => (
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0 mb-6">
            <ResourceCard
                title="Repository"
                count={settings.repo_name ? `${settings.repo_owner}/${settings.repo_name}` : "Not Configured"}
                icon={<Github className="w-4 h-4" />}
                color={settings.repo_name ? "bg-primary" : "bg-muted text-muted-foreground"}
                className={settings.repo_name ? "border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all" : "border-border/50 bg-muted/20 shadow-sm transition-all"}
                isLoading={loading}
            />
            <ResourceCard
                title="Target Branch"
                count={settings.repo_name ? (settings.branch || "main") : "Not Configured"}
                icon={<Send className="w-4 h-4 rotate-45" />}
                color={settings.repo_name ? "bg-indigo-500" : "bg-muted text-muted-foreground"}
                className={settings.repo_name ? "border-indigo-500/20 bg-indigo-500/5 shadow-none hover:border-indigo-500/30 transition-all" : "border-border/50 bg-muted/20 shadow-sm transition-all"}
                isLoading={loading}
            />
            <ResourceCard
                title="Sync Strategy"
                count={settings.repo_name ? (settings.auto_push ? "Auto-Sync" : "Manual") : "Not Configured"}
                icon={<Activity className={cn("w-4 h-4", settings.auto_push && settings.repo_name && "animate-pulse")} />}
                color={settings.repo_name ? (settings.auto_push ? "bg-emerald-500" : "bg-amber-500") : "bg-muted text-muted-foreground"}
                className={settings.repo_name ? (settings.auto_push ? "border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all" : "border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all") : "border-border/50 bg-muted/20 shadow-sm transition-all"}
                isLoading={loading}
            />
            <ResourceCard
                title="Integrations"
                count={credentials.find(c => c.id === settings.github_credential_id)?.name || "Not Configured"}
                icon={<Shield className="w-4 h-4" />}
                color={settings.github_credential_id ? "bg-orange-500" : "bg-muted text-muted-foreground"}
                className={settings.github_credential_id ? "border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all" : "border-border/50 bg-muted/20 shadow-sm transition-all"}
                isLoading={loading}
            />
        </div>
    );

    const parsedDiff = React.useMemo(() => {
        if (!diffContent) return { metadata: null, diff: '' };

        const lines = diffContent.split('\n');
        const metadata: any = {};
        let diffStartIndex = 0;
        let commitMessageLines: string[] = [];

        if (lines[0]?.startsWith('commit ')) {
            metadata.commit = lines[0].replace('commit ', '').trim();

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].startsWith('Author:')) {
                    metadata.author = lines[i].replace('Author:', '').trim();
                } else if (lines[i].startsWith('Date:')) {
                    metadata.date = lines[i].replace('Date:', '').trim();
                } else if (lines[i].startsWith('diff --git')) {
                    diffStartIndex = i;
                    break;
                } else if (lines[i].startsWith('    ')) {
                    commitMessageLines.push(lines[i].trim());
                }
            }
            metadata.message = commitMessageLines.join('\n').trim();

            return {
                metadata,
                diff: lines.slice(diffStartIndex).join('\n')
            };
        }

        return { metadata: null, diff: diffContent };
    }, [diffContent]);

    if (helmError) {
        return <HelmErrorState error={helmError} />;
    }

    return (
        <PageLayout
            title="Charts Control Center"
            subtitle="Central hub for GitOps configuration, automated synchronization, and version history"
            icon={Box}
            actions={
                <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => setIsConfigWizardOpen(true)}
                    className="h-9 font-black uppercase tracking-widest text-[10px] px-5 shadow-lg shadow-primary/20"
                >
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    Configure GitOps
                </Button>
            }
        >
            <div className="flex flex-col gap4 w-full">
                {/* At-a-glance Summary */}
                <ConfigSummary />

                {/* Main Audit History Table */}
                <ResourceTable<HistoryItem>
                    title="Audit History"
                    description="Enterprise-grade traceability for all library version changes, including synchronization logs and rollback events."
                    loading={historyLoading}
                    data={filteredHistory.map(item => ({
                        ...item,
                        showUndo: true,
                        showViewDetails: true,
                    }))}
                    columns={[
                        {
                            header: 'Hash',
                            accessor: 'hash',
                            cell: (row) => (
                                <div className="flex items-center gap-2 group/hash">
                                    <code className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                        {row.hash.substring(0, 7)}
                                    </code>
                                </div>
                            )
                        },
                        {
                            header: 'Author',
                            accessor: 'author',
                            cell: (row) => (
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border border-border/40">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground">{row.author}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Documentation',
                            accessor: 'message',
                            cell: (row) => (
                                <div className="flex items-center gap-3">
                                    {row.message.toLowerCase().includes('revert') ? (
                                        <Badge variant="warning" className="text-[9px] font-black uppercase h-5 px-1.5 border-none">Rollback</Badge>
                                    ) : row.message.toLowerCase().includes('delete') ? (
                                        <Badge variant="destructive" className="text-[9px] font-black uppercase h-5 px-1.5 border-none">Delete</Badge>
                                    ) : (
                                        <Badge variant="success" className="text-[9px] font-black uppercase h-5 px-1.5 border-none">Update</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground font-medium line-clamp-1">{row.message}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Timestamp',
                            accessor: 'date',
                            cell: (row) => (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">{row.date}</span>
                                </div>
                            )
                        }
                    ]}
                    extraHeaderContent={
                        <div className="flex items-center gap-3">
                            <div className="relative mr-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search commits..."
                                    className="pl-9 h-9 w-[240px] text-xs bg-background/50 border-border/30"
                                />
                            </div>
                            {settings.repo_name && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePull}
                                        disabled={pulling || pushing}
                                        className="h-9 font-bold uppercase tracking-widest text-[10px] px-4 border-border/40 hover:bg-muted/50"
                                    >
                                        {pulling ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2 text-primary" />}
                                        Pull from Remote
                                    </Button>
                                    <Button
                                        onClick={handlePush}
                                        disabled={pushing || pulling}
                                        variant="outline"
                                        size="sm"
                                        className="h-9 font-bold uppercase tracking-widest text-[10px] px-4 border-border/40 hover:bg-muted/50"
                                    >
                                        {pushing ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                        ) : (
                                            <>
                                                <CloudUpload className="h-3.5 w-3.5 mr-2 text-primary" />
                                                Push to Remote
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                    onViewDetails={(row) => handleViewDiff(row.hash)}
                    onUndo={(row) => {
                        setSelectedCommit(row);
                        setRevertDialogOpen(true);
                    }}
                    className="border-none p-0 shadow-xl"
                    tableClassName="bg-card/20 h-[580px]"
                />
            </div>

            {/* Config Wizard */}
            <FormWizard
                isWizardOpen={isConfigWizardOpen}
                setIsWizardOpen={setIsConfigWizardOpen}
                steps={configSteps}
                currentStep={currentWizardStep}
                setCurrentStep={setCurrentWizardStep}
                initialValues={settings}
                name="gitops-config"
                heading={{
                    primary: 'GitOps Configuration',
                    secondary: 'Setup remote synchronization and automated deployment strategies',
                    icon: Github,
                }}
                schema={gitOpsSchema}
                onSubmit={handleSave}
                submitLabel="Apply Configuration"
            />

            {/* Conflict Resolver Modal */}
            <AlertDialog open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
                <AlertDialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-primary/20 shadow-2xl">
                    <AlertDialogHeader className="px-8 py-6 border-b border-border/30 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive animate-pulse">
                                    <AlertCircle className="h-7 w-7" />
                                </div>
                                <div>
                                    <AlertDialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase">Conflict Detection</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm font-medium text-muted-foreground mt-1">
                                        Remote repository has conflicting changes. Please resolve manually to continue synchronization.
                                    </AlertDialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="destructive" className="px-3 py-1 text-[11px] font-black uppercase tracking-widest border-none">
                                    {conflictStatus?.files.length} Unresolved Files
                                </Badge>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="flex-1 flex min-h-0">
                        {/* File List */}
                        <div className="w-80 border-r border-border/30 bg-muted/10 overflow-y-auto p-4 space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-2">Conflict Inventory</h4>
                            {conflictStatus?.files.map(file => (
                                <button
                                    key={file}
                                    onClick={() => {
                                        setCurrentConflictFile(file);
                                        fetchFileContent(file);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group flex items-center justify-between border border-transparent",
                                        currentConflictFile === file
                                            ? "bg-primary/10 border-primary/20 shadow-sm"
                                            : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className={cn("h-4 w-4 shrink-0", currentConflictFile === file ? "text-primary" : "text-muted-foreground")} />
                                        <span className="text-xs font-bold truncate">{file}</span>
                                    </div>
                                    <ChevronRight className={cn("h-4 w-4 transition-transform", currentConflictFile === file ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} />
                                </button>
                            ))}
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 bg-background/50 flex flex-col min-h-0">
                            {currentConflictFile ? (
                                <>
                                    <div className="px-6 py-3 border-b border-border/30 flex items-center justify-between bg-muted/5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px]">{currentConflictFile}</Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="gradient"
                                            onClick={handleResolveFile}
                                            disabled={resolving}
                                            className="h-8 font-black uppercase tracking-widest text-[9px] px-4"
                                        >
                                            {resolving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                            Mark as Resolved
                                        </Button>
                                    </div>
                                    <div className="flex-1 p-0 overflow-hidden">
                                        <Editor
                                            height="100%"
                                            language={currentConflictFile?.endsWith('.json') ? 'json' : 'yaml'}
                                            theme="vs-dark"
                                            value={conflictFileContent}
                                            onChange={(value) => setConflictFileContent(value || '')}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                wordWrap: "on",
                                                padding: { top: 16 },
                                                scrollBeyondLastLine: false,
                                                renderWhitespace: "selection"
                                            }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <div className="p-6 rounded-full bg-muted/20">
                                        <FileText className="h-12 w-12 opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium italic">Select a file from the inventory to begin resolution</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter className="px-8 py-6 border-t border-border/30 bg-muted/20 gap-4">
                        <Button
                            variant="outline"
                            onClick={handleAbortSync}
                            className="h-10 font-bold uppercase tracking-widest text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                            Abort Sync
                        </Button>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePull}
                                disabled={pulling || pushing || (conflictStatus?.files.length || 0) > 0}
                                className="h-10 font-bold uppercase tracking-widest text-[10px] px-4 border-border/40"
                            >
                                {pulling ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2 text-primary" />}
                                Pull from Remote
                            </Button>
                            <Button
                                onClick={handlePush}
                                disabled={pushing || pulling || (conflictStatus?.files.length || 0) > 0}
                                variant="gradient"
                                size="sm"
                                className="h-10 font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-primary/20 min-w-[160px]"
                            >
                                {pushing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                ) : (
                                    <>
                                        <CloudUpload className="h-3.5 w-3.5 mr-2" />
                                        Push to Remote
                                    </>
                                )}
                            </Button>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diff View Modal */}
            <Sheet open={diffModalOpen} onOpenChange={setDiffModalOpen}>
                <SheetContent side="right" className="w-[900px] sm:w-[1000px] sm:max-w-[1000px] bg-background/95 backdrop-blur-2xl border-l border-border/30 p-0 overflow-hidden shadow-2xl">
                    <SheetHeader className="px-8 py-10 bg-muted/10 border-b border-border/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight uppercase">Commit Analysis</SheetTitle>
                                <SheetDescription className="text-sm font-medium text-muted-foreground mt-1">
                                    Comparing local library state with selected historical version.
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="p-8 h-full overflow-y-auto pb-40">
                        {loadingDiff ? (
                            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Generating Diff...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {parsedDiff.metadata && (
                                    <div className="p-6 rounded-2xl bg-muted/10 border border-border/30 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Commit Hash</h4>
                                                <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">{parsedDiff.metadata.commit.substring(0, 8)}</code>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Author</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border border-border/40">
                                                        <User className="h-2.5 w-2.5 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground">{parsedDiff.metadata.author}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Date</h4>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span className="text-sm">{parsedDiff.metadata.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {parsedDiff.metadata.message && (
                                            <div className="pt-4 border-t border-border/20">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Commit Message</h4>
                                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{parsedDiff.metadata.message}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 font-mono text-[13px] leading-relaxed overflow-x-auto">
                                    {parsedDiff.diff ? (
                                        <pre className="whitespace-pre-wrap">
                                            {parsedDiff.diff.split('\n').map((line, i) => (
                                                <div key={i} className={cn(
                                                    "px-2 rounded",
                                                    line.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" :
                                                        line.startsWith('-') ? "bg-destructive/10 text-destructive" :
                                                            line.startsWith('@@') ? "text-primary/50 text-[11px] my-2 border-y border-primary/5 py-1" :
                                                                "text-muted-foreground/80"
                                                )}>
                                                    {line}
                                                </div>
                                            ))}
                                        </pre>
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground italic">No structural changes detected in this version</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Rollback Confirm Dialog */}
            <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-500 flex items-center gap-2">
                            <Undo className="h-5 w-5" /> Confirm Rollback
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-sm text-amber-700 font-medium leading-relaxed">
                                    You are about to revert the system to version <code className="font-black text-amber-900 bg-amber-500/10 px-1.5 rounded">{selectedCommit?.hash.substring(0, 8)}</code>.
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This action will create a new "revert commit" that restores the library's state to match the selected historical point. This preserves audit history and avoids non-fast-forward push conflicts.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="h-10 text-xs font-bold uppercase tracking-widest border-border/40">Cancel Action</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleRevert(`System Rollback: Restored to ${selectedCommit?.hash.substring(0, 8)}`)}
                            disabled={reverting}
                            className="h-10 text-xs font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                        >
                            {reverting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm & Restore"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CommitDialog
                isOpen={commitDialogOpen}
                onClose={() => setCommitDialogOpen(false)}
                onConfirm={handleRevert}
                title="Rollback Documentation"
                description="Please provide a reason for this rollback for the audit history."
            />
        </PageLayout>
    );
}

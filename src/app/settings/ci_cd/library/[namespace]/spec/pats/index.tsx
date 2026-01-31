import React, { useEffect, useState, useMemo } from 'react';
import {
    ShieldCheck,
    Plus,
    RefreshCw,
    Trash2,
    Zap,
    Key,
    Lock,
} from 'lucide-react';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import FormWizard from '@/components/wizard/form-wizard';
import * as z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RequiredBadge } from "@/components/docker/network/forms/badges";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import PageLayout from "@/components/PageLayout";

interface PATItem {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    last_used_at?: string;
    scopes?: string[];
    usage_count?: number;
    used_repos?: string[];
}

// Schema and Form Component
const patSchema = z.object({
    name: z.string().min(1, "Display name is required"),
    token: z.string().min(1, "Token is required").refine(val => val.startsWith("ghp_") || val.startsWith("github_pat_"), {
        message: "Token must start with 'ghp_' or 'github_pat_'"
    }),
});

const PatForm = ({ control }: { control: any }) => {
    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Display Name <RequiredBadge /></FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., CI/CD Pipeline Token" {...field} />
                        </FormControl>
                        <FormDescription>
                            A friendly name to identify this token.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>GitHub Secret Token <RequiredBadge /></FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="ghp_xxxxxxxxxxxx" {...field} className="font-mono" />
                        </FormControl>
                        <FormDescription>
                            The generated Personal Access Token from GitHub. Required scopes: <code>repo</code>, <code>workflow</code>.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 text-xs font-medium flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <p>Tokens are encrypted at rest. Ensure you do not expose this token elsewhere.</p>
            </div>
        </div>
    );
};

const PatsManagementPage = () => {
    const [pats, setPats] = useState<PATItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pollingEnabled, setPollingEnabled] = useState<boolean | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('provision');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [patToDelete, setPatToDelete] = useState<number | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<Record<number, 'unverified' | 'valid' | 'invalid' | 'loading'>>({});

    const fetchPats = async () => {
        setLoading(true);
        try {
            const res = await DefaultService.apiIntegrationGithubPatGet();
            setPats(res as any || []);
            setVerificationStatus({});
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const fetchPollingStatus = async () => {
        try {
            const res: any = await DefaultService.apiIntegrationGithubPollingGet();
            if (res) {
                setPollingEnabled(res.enabled);
            }
        } catch (err: any) { }
    };

    useEffect(() => {
        fetchPats();
        fetchPollingStatus();
    }, []);

    const handleCreatePat = async (values: z.infer<typeof patSchema>) => {
        try {
            await DefaultService.apiIntegrationGithubPatPost({
                requestBody: { name: values.name, token: values.token, active: false }
            });
            toast.success('PAT added successfully');
            fetchPats();
            setIsWizardOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to add PAT');
        }
    };

    const handleDelete = (id: number) => {
        setPatToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!patToDelete) return;
        try {
            await DefaultService.apiIntegrationGithubPatDelete({ id: patToDelete });
            toast.success('PAT deleted');
            fetchPats();
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setDeleteDialogOpen(false);
            setPatToDelete(null);
        }
    };

    const handleSetActive = async (id: number, active: boolean) => {
        try {
            await DefaultService.apiIntegrationGithubPatPut({ id, requestBody: { active } });
            toast.success(active ? 'PAT enabled' : 'PAT disabled');
            fetchPats();
        } catch (err: any) {
            toast.error(err.message || String(err));
        }
    };

    const handleVerify = async (id: number, silent = false) => {
        if (!silent) toast.loading("Verifying token...", { id: `verify-${id}` });
        setVerificationStatus(prev => ({ ...prev, [id]: 'loading' }));
        try {
            const res: any = await DefaultService.apiIntegrationGithubPatPut({ id, requestBody: { verify: true } });
            if (res.valid) {
                if (!silent) toast.success("Token is valid", { id: `verify-${id}` });
                setVerificationStatus(prev => ({ ...prev, [id]: 'valid' }));
            } else {
                if (!silent) toast.error(`Invalid: ${res.message}`, { id: `verify-${id}` });
                setVerificationStatus(prev => ({ ...prev, [id]: 'invalid' }));
            }
        } catch (err: any) {
            if (!silent) toast.error(err.message || String(err), { id: `verify-${id}` });
            setVerificationStatus(prev => ({ ...prev, [id]: 'invalid' }));
        }
    };

    const handleVerifyAll = async () => {
        const toastId = toast.loading("Verifying all tokens...");
        const newStatus: any = {};
        pats.forEach(p => newStatus[p.id] = 'loading');
        setVerificationStatus(prev => ({ ...prev, ...newStatus }));

        try {
            await Promise.all(pats.map(p => handleVerify(p.id, true)));
            toast.success("Verification complete", { id: toastId });
        } catch (err) {
            toast.error("Some verifications failed", { id: toastId });
        }
    };

    const handleTogglePolling = async () => {
        try {
            const target = !pollingEnabled;
            await DefaultService.apiIntegrationGithubPollingPut({
                requestBody: { enabled: target, interval_seconds: 300 }
            });
            setPollingEnabled(target);
            toast.success(`SCM Polling ${target ? 'enabled' : 'disabled'}`);
        } catch (err: any) {
            toast.error(err?.message || String(err));
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Token Name',
            accessor: 'name',
            cell: (row: PATItem) => (
                <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{row.name}</span>
                </div>
            )
        },
        {
            header: 'Verification',
            accessor: 'verified',
            cell: (row: PATItem) => {
                const status = verificationStatus[row.id];
                if (status === 'valid') return <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20">Verified</Badge>;
                if (status === 'invalid') return <Badge variant="destructive" className="h-5">Invalid</Badge>;
                if (status === 'loading') return <span className="text-xs text-muted-foreground animate-pulse">Checking...</span>;
                return <span className="text-xs text-muted-foreground italic">Verification needed</span>;
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            cell: (row: PATItem) => row.active ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20">Active</Badge>
            ) : (
                <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
            )
        },
        {
            header: 'Created At',
            accessor: 'created_at',
            cell: (row: PATItem) => (
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {new Date(row.created_at).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Usage',
            accessor: 'usage',
            cell: (row: PATItem) => (
                <span className={`text-xs font-medium ${row.usage_count ? 'text-primary' : 'text-muted-foreground'}`}>
                    {row.usage_count || 0} Repos
                </span>
            )
        },
    ], [verificationStatus]);

    const patWizardSteps = [
        {
            id: 'provision',
            label: 'Token Details',
            description: 'Provide token credentials',
            longDescription: 'Enter the display name and the secret token generated from GitHub.',
            icon: ShieldCheck,
            component: PatForm,
        }
    ];

    return (
        <PageLayout
            title="Personal Access Tokens"
            subtitle="Securely manage GitHub credentials for source control polling and repository interaction."
            icon={Lock}
            actions={
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background mb-1">
                        <div className={`w-2 h-2 rounded-full ${pollingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold mr-2">Polling: {pollingEnabled ? 'Active' : 'Stopped'}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleTogglePolling}>
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleVerifyAll} disabled={loading || pats.length === 0} className="gap-2 mb-1">
                        <ShieldCheck size={14} />
                        Verify All
                    </Button>
                    <Button variant="outline" onClick={fetchPats} disabled={loading} className="gap-2 mb-1">
                        <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => setIsWizardOpen(true)} className="gap-2 shadow-lg shadow-primary/20 mb-1">
                        <Plus size={14} />
                        Provision Token
                    </Button>
                </div>
            }
        >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
                <ResourceCard
                    title="Total Tokens"
                    count={pats.length}
                    icon={<Key className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Active Tokens"
                    count={pats.filter(p => p.active).length}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Polling Status"
                    count={pollingEnabled ? "Healthy" : "Disabled"}
                    icon={<Zap className="w-4 h-4 text-amber-500" />}
                    color="bg-amber-500"
                    className="border-amber-500/20 bg-amber-500/5 shadow-none"
                    isLoading={loading}
                />
            </div>

            {/* Token List */}
            <div className="flex-1 min-h-0 mt-4">
                <ResourceTable
                    data={pats}
                    columns={columns}
                    loading={loading}
                    title="Secure Vault"
                    description="Manage your stored Personal Access Tokens."
                    icon={<ShieldCheck className="w-4 h-4" />}
                    onDelete={(row) => handleDelete(row.id)}
                    customActions={[
                        {
                            label: "Verify",
                            icon: ShieldCheck,
                            onClick: (row) => handleVerify(row.id),
                            show: (row) => true
                        },
                        {
                            label: "Enable",
                            icon: Zap,
                            onClick: (row) => handleSetActive(row.id, true),
                            show: (row) => !row.active
                        },
                        {
                            label: "Disable",
                            icon: Lock,
                            onClick: (row) => handleSetActive(row.id, false),
                            show: (row) => row.active
                        }
                    ]}
                    onBulkDelete={async (items) => {
                        if (!confirm(`Delete ${items.length} tokens?`)) return;
                        for (const item of items) {
                            await DefaultService.apiIntegrationGithubPatDelete({ id: item.id });
                        }
                        toast.success("Tokens deleted");
                        fetchPats();
                    }}
                />
            </div>

            <FormWizard
                name="provision-pat-wizard"
                isWizardOpen={isWizardOpen}
                setIsWizardOpen={setIsWizardOpen}
                steps={patWizardSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                initialValues={{ name: '', token: '' }}
                schema={patSchema}
                onSubmit={handleCreatePat}
                heading={{
                    primary: "Provision New Token",
                    secondary: "Add a new GitHub Personal Access Token to the secure vault.",
                    icon: Key
                }}
                submitLabel="Add to Vault"
                submitIcon={Plus}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Token?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="text-foreground/80">
                                Are you sure you want to permanently delete this Personal Access Token?
                            </p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 font-medium">
                                    Revoking this token will immediately stop any polling or CI/CD operations that depend on it. This action cannot be undone.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-foreground border-none">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Token
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
};

export default PatsManagementPage;

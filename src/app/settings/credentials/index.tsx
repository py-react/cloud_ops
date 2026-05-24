import React, { useEffect, useState, useMemo } from 'react';
import {
    ShieldCheck,
    Plus,
    RefreshCw,
    Trash2,
    Zap,
    Key,
    Lock,
    Package,
    Terminal,
    Upload,
    FileJson,
    Cloud,
} from 'lucide-react';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import FormWizard from '@/components/wizard/form-wizard';
import * as z from 'zod';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface CredentialItem {
    id: number;
    name: string;
    provider: 'github' | 'npm' | 'pypi' | 'gcp' | 'aws';
    active: boolean;
    created_at: string;
    last_used_at?: string;
    scopes?: string[];
    usage_count?: number;
    used_repos?: string[];
}

const credentialSchema = z.object({
    name: z.string().min(1, "Display name is required"),
    provider: z.enum(['github', 'npm', 'pypi', 'gcp', 'aws']),
    token: z.string().min(1, "Token is required").superRefine((val, ctx) => {
        // We'll handle refined validation in the submit logic or via dynamic schema switching if needed
        // For now, let's just ensure it's not empty. Basic validation is handled in the backend anyway.
    }),
    access_key_id: z.string().optional().default(''),
    secret_access_key: z.string().optional().default(''),
    endpoint_url: z.string().optional().default(''),
});

const CredentialForm = () => {
    const { control, watch, setValue } = useFormContext();
    const provider = watch('provider');
    const tokenValue = watch('token');
    const [fileName, setFileName] = useState<string | null>(null);
    const awsAccessKeyId = watch('access_key_id');
    const awsSecretAccessKey = watch('secret_access_key');
    const awsEndpointUrl = watch('endpoint_url');

    useEffect(() => {
        if (provider === 'aws') {
            const payload: Record<string, string> = {
                access_key_id: awsAccessKeyId || '',
                secret_access_key: awsSecretAccessKey || '',
            };
            if (awsEndpointUrl?.trim()) payload.endpoint_url = awsEndpointUrl.trim();
            setValue('token', JSON.stringify(payload));
        }
    }, [provider, awsAccessKeyId, awsSecretAccessKey, awsEndpointUrl, setValue]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            
            if (!json.type || json.type !== 'service_account') {
                toast.error('Invalid GCP Service Account JSON file');
                return;
            }
            
            setValue('token', text);
            setFileName(file.name);
            toast.success(`Loaded ${file.name} successfully`);
        } catch (err) {
            toast.error('Failed to parse JSON file');
        }
    };

    const hasFile = fileName || (provider === 'gcp' && tokenValue);

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Display Name <RequiredBadge /></FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Production GitHub Token" {...field} />
                        </FormControl>
                        <FormDescription>
                            A friendly name to identify this credential.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="provider"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Credential Type <RequiredBadge /></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                <SelectItem value="github" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-blue-500" />
                                        <span>GitHub PAT</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="npm">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5 text-red-500" />
                                        <span>NPM Token</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pypi">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                                        <span>PyPI / Pip Token</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="gcp">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                                        <span>GCP Service Account</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="aws">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="w-3.5 h-3.5 text-yellow-500" />
                                        <span>AWS IAM Credentials</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            The service this credential will be used for.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {provider === 'gcp' ? (
                <FormField
                    control={control}
                    name="token"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service Account Key File <RequiredBadge /></FormLabel>
                            
                            {!hasFile ? (
                                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                                    <label className="cursor-pointer">
                                        <FileJson className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-sm font-medium mb-1">Drop GCP Service Account JSON here</p>
                                        <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
                                        <input 
                                            type="file" 
                                            accept=".json" 
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <FileJson className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">{fileName || 'Service Account JSON loaded'}</span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="ml-auto text-muted-foreground hover:text-red-500"
                                            onClick={() => { setFileName(null); field.onChange(''); }}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <input type="hidden" {...field} />
                                </div>
                            )}
                            
                            <FormDescription className="mt-2">
                                Download from GCP Console: IAM & Admin → Service Accounts → Keys → Add Key → Create new key (JSON)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ) : provider === 'aws' ? (
                <>
                    <FormField
                        control={control}
                        name="access_key_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Access Key ID <RequiredBadge /></FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., AKIAIOSFODNN7EXAMPLE" {...field} className="font-mono" />
                                </FormControl>
                                <FormDescription>
                                    Found in AWS IAM → Security credentials → Access keys.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="secret_access_key"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Secret Access Key <RequiredBadge /></FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Paste your secret access key..." {...field} className="font-mono" />
                                </FormControl>
                                <FormDescription>
                                    Keep this confidential — it grants access to your AWS resources.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="endpoint_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endpoint URL <span className="text-[10px] text-muted-foreground font-normal">(optional)</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="http://localhost:4566" {...field} className="font-mono" />
                                </FormControl>
                                <FormDescription>
                                    Leave empty for real AWS. Set to your LocalStack or custom endpoint URL for local development.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <input type="hidden" name="token" />
                </>
            ) : (
                <FormField
                    control={control}
                    name="token"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secret Token <RequiredBadge /></FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Paste your secret token here..." {...field} className="font-mono" />
                            </FormControl>
                            <FormDescription>
                                {provider === 'github' && "GitHub tokens usually start with 'ghp_'. Required scopes: repo, workflow."}
                                {provider === 'npm' && "Scoped or Classic NPM tokens for package publication."}
                                {provider === 'pypi' && "PyPI API tokens for package uploads."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-primary/80 text-[11px] font-medium flex gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                <p>Tokens are encrypted at rest using AES-256. They are only decrypted in memory during build or synchronization operations.</p>
            </div>
        </div>
    );
};

const CredentialsHubPage = () => {
    const [credentials, setCredentials] = useState<CredentialItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('details');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<Record<number, { status: 'unverified' | 'valid' | 'invalid' | 'loading', error?: string }>>({});

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const res = await DefaultService.apiIntegrationCredentialsGet();
            setCredentials(res as any || []);
            setVerificationStatus({});
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, []);

    const handleCreateCredential = async (values: z.infer<typeof credentialSchema>) => {
        try {
            await DefaultService.apiIntegrationCredentialsPost({
                requestBody: { 
                    name: values.name, 
                    token: values.token, 
                    provider: values.provider,
                    active: true 
                }
            });
            toast.success('Credential added successfully');
            fetchCredentials();
            setIsWizardOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to add credential');
        }
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await DefaultService.apiIntegrationCredentialsDelete({ id: idToDelete });
            toast.success('Credential deleted');
            fetchCredentials();
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleVerify = async (id: number, silent = false) => {
        if (!silent) toast.loading("Verifying token...", { id: `verify-${id}` });
        setVerificationStatus(prev => ({ ...prev, [id]: { status: 'loading' } }));
        try {
            const res: any = await DefaultService.apiIntegrationCredentialsPut({ id, requestBody: { verify: true } });
            if (res.valid) {
                if (!silent) toast.success("Token is valid", { id: `verify-${id}` });
                setVerificationStatus(prev => ({ ...prev, [id]: { status: 'valid' } }));
            } else {
                if (!silent) toast.error(`Invalid: ${res.message}`, { id: `verify-${id}` });
                setVerificationStatus(prev => ({ ...prev, [id]: { status: 'invalid', error: res.message, gcp_status: res.gcp_status, failed_api: res.failed_api } }));
            }
        } catch (err: any) {
            const errorMsg = err.message || String(err);
            if (!silent) toast.error(errorMsg, { id: `verify-${id}` });
            setVerificationStatus(prev => ({ ...prev, [id]: { status: 'invalid', error: errorMsg } }));
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Name',
            accessor: 'name',
            cell: (row: CredentialItem) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {row.id}</span>
                </div>
            )
        },
        {
            header: 'Provider',
            accessor: 'provider',
            cell: (row: CredentialItem) => (
                <div className="flex items-center gap-2">
                    {row.provider === 'github' && <Zap className="w-3.5 h-3.5 text-blue-500" />}
                    {row.provider === 'npm' && <Package className="w-3.5 h-3.5 text-red-500" />}
                    {row.provider === 'pypi' && <Terminal className="w-3.5 h-3.5 text-blue-400" />}
                    {row.provider === 'gcp' && <Zap className="w-3.5 h-3.5 text-orange-500" />}
                    {row.provider === 'aws' && <Cloud className="w-3.5 h-3.5 text-yellow-500" />}
                    <span className="text-xs font-bold uppercase tracking-wider">{row.provider}</span>
                </div>
            )
        },
        {
            header: 'Verification',
            accessor: 'status',
            cell: (row: CredentialItem) => {
                const status = verificationStatus[row.id];
                if (status?.status === 'valid') return <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20 text-[10px]">Verified</Badge>;
                if (status?.status === 'invalid') {
                    const cleanError = status.error?.replace(/&#34;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&') || 'Unknown error';
                    return (
                        <Badge 
                            variant="destructive" 
                            className="h-4 text-[10px] cursor-help"
                            title={cleanError}
                        >
                            Invalid
                        </Badge>
                    );
                }
                if (status?.status === 'loading') return <span className="text-[10px] text-muted-foreground animate-pulse">Checking...</span>;
                if (row.provider === 'pypi') return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px]">Format</Badge>;
                return <span className="text-[10px] text-muted-foreground italic">Pending</span>;
            }
        },
        {
            header: 'Usage',
            accessor: 'usage',
            cell: (row: CredentialItem) => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border/50 text-muted-foreground text-[10px]">
                        {row.usage_count || 0} Repos
                    </Badge>
                </div>
            )
        },
        {
            header: 'Created',
            accessor: 'created_at',
            cell: (row: CredentialItem) => (
                <span className="text-muted-foreground text-[10px] font-medium">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            )
        },
    ], [verificationStatus]);

    const credentialSteps = [
        {
            id: 'details',
            label: 'Provisioning',
            description: 'Credential setup',
            longDescription: 'Select the provider and enter the secret token to authorize the build system.',
            icon: ShieldCheck,
            component: CredentialForm,
        }
    ];

    return (
        <PageLayout
            title="Credentials Hub"
            subtitle="Centralized management for build triggers, package publication, and source control secrets."
            icon={Lock}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={fetchCredentials} disabled={loading} className="gap-2 border-border/50">
                        <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
                        Sync
                    </Button>
                    <Button variant="gradient" size="sm" onClick={() => setIsWizardOpen(true)} className="gap-2 shadow-lg shadow-primary/20 bg-primary h-9">
                        <Plus size={16} />
                        New Credential
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
                <ResourceCard
                    title="Total Secrets"
                    count={credentials.length}
                    icon={<Key className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/10 bg-primary/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="GitHub PATs"
                    count={credentials.filter(c => c.provider === 'github').length}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/10 bg-blue-500/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Distribution Tokens"
                    count={credentials.filter(c => c.provider !== 'github').length}
                    icon={<Package className="w-4 h-4 text-emerald-500" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/10 bg-emerald-500/5 shadow-none"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 mt-6">
                <ResourceTable
                    data={credentials}
                    columns={columns}
                    loading={loading}
                    title="Encrypted Vault"
                    description="Securely stored credentials for automated pipelines."
                    icon={<ShieldCheck className="w-4 h-4" />}
                    onDelete={(row) => {
                        setIdToDelete(row.id);
                        setDeleteDialogOpen(true);
                    }}
                    customActions={[
                        {
                            label: "Verify",
                            icon: ShieldCheck,
                            onClick: (row) => handleVerify(row.id),
                            show: (row) => true
                        }
                    ]}
                />
            </div>

            <FormWizard
                name="provision-credential-wizard"
                isWizardOpen={isWizardOpen}
                setIsWizardOpen={setIsWizardOpen}
                steps={credentialSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                initialValues={{ name: '', provider: 'github', token: '', access_key_id: '', secret_access_key: '', region: 'us-east-1' }}
                schema={credentialSchema}
                onSubmit={handleCreateCredential}
                heading={{
                    primary: "Provision Credential",
                    secondary: "Securely add a new token to the Integration Vault.",
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
                            Revoke Credential?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="text-foreground/80">
                                This will permanently remove the credential from the vault.
                            </p>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                                <p className="text-xs leading-relaxed text-destructive font-medium">
                                    Any active build pipelines or automated release configurations using this credential will immediately fail.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-foreground border-none h-10 px-6">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20 h-10 px-6"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Permanently Revoke
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
};

export default CredentialsHubPage;

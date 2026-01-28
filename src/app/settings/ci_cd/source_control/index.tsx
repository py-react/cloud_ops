import React, { useState, useEffect, useMemo } from 'react';
import {
    Plug,
    RefreshCw,
    Plus,
    Search,
    MoreVertical,
    GitBranch,
    ShieldCheck,
    ExternalLink,
    Trash2,
    Eye,
    MessageSquare,
    Settings2,
    Key
} from 'lucide-react';
import { DefaultService } from '@/gingerJs_api_client';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import useNavigate from '@/libs/navigate';
import { FormWizard } from '@/components/wizard/form-wizard';
import * as z from 'zod';
import PageLayout from '@/components/PageLayout';

// Step sections
import BasicRepoConfig from '@/components/ciCd/sourceControl/github/forms/sections/BasicConfig';

const repoSchema = z.object({
    name: z.string().min(1, 'Repository name is required'),
    branches: z.array(z.object({ value: z.string() })).min(1, 'At least one branch is required'),
    pat_id: z.number().nullable().optional(),
});

type RepoFormData = z.infer<typeof repoSchema>;

interface FlatMappedRepo {
    id: string;
    repository: string;
    branch: string;
    status: string;
    permissionInfo: string | React.ReactNode;
}

const SourceControlPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
    const [detailedPermissions, setDetailedPermissions] = useState<Record<string, any>>({});

    // Modal states
    const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
    const [editingRepo, setEditingRepo] = useState<{ name: string; branches: string[]; pat_id?: number | null } | null>(null);
    const [currentStep, setCurrentStep] = useState('basic');

    const repoSteps = [
        {
            id: 'basic',
            label: 'Repository Details',
            icon: Plug,
            description: 'General SCM settings',
            longDescription: 'Provide the name of the GitHub repository (owner/repo) and configure which branches should be allowed to trigger CI workflows via polling.',
            component: BasicRepoConfig,
        },
    ];

    const repoInitialValues: RepoFormData = editingRepo ? {
        name: editingRepo.name,
        branches: editingRepo.branches.map(b => ({ value: b })),
        pat_id: editingRepo.pat_id
    } : {
        name: '',
        branches: [],
        pat_id: null,
    };

    const handleRepoSubmit = async (data: RepoFormData) => {
        try {
            const allowed_branches = data.branches.map(b => b.value);
            const isEdit = !!editingRepo;

            const res = isEdit
                ? await DefaultService.apiIntegrationGithubReposPut({
                    requestBody: { name: data.name, branches: allowed_branches, pat_id: data.pat_id ? data.pat_id : undefined }
                })
                : await DefaultService.apiIntegrationGithubReposPost({
                    requestBody: { name: data.name, branches: allowed_branches, pat_id: data.pat_id ? data.pat_id : undefined }
                });

            const body: any = res as any;
            if (body && body.success) {
                toast.success(body.message || (isEdit ? 'Repository updated' : 'Repository added'));
                fetchData();
                setIsAddRepoOpen(false);
                setEditingRepo(null);
            } else {
                toast.error((body && body.message) || (isEdit ? 'Failed to update repository' : 'Failed to add repository'));
            }
        } catch (err: any) {
            toast.error(err.message || String(err));
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await DefaultService.apiIntegrationGithubPollingGet();
            setData(res);

            if (res.allowed_branches) {
                const uniqueRepos = Object.keys(res.allowed_branches);
                uniqueRepos.forEach(repo => fetchDetailedPermissions(repo));
            }
        } catch (err: any) {
            toast.error("Failed to fetch source control data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailedPermissions = async (repoName: string) => {
        try {
            const details = await DefaultService.apiIntegrationGithubPollingAccessGet({ name: repoName });
            setDetailedPermissions(prev => ({ ...prev, [repoName]: details }));
        } catch (err) {
            console.error(`Failed to fetch permissions for ${repoName}:`, err);
        }
    };

    const [pats, setPats] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        DefaultService.apiIntegrationGithubPatGet().then((res: any) => setPats(res)).catch(console.error);
    }, []);

    const handleSyncRepo = async (repoName: string) => {
        setRefreshing(prev => ({ ...prev, [repoName]: true }));
        try {
            await fetchDetailedPermissions(repoName);
            toast.success(`Synced access for ${repoName}`);
        } catch (err: any) {
            toast.error(`Failed to sync ${repoName}: ` + err.message);
        } finally {
            setRefreshing(prev => ({ ...prev, [repoName]: false }));
        }
    };

    const handleDeleteRepo = async (repoName: string) => {
        if (!confirm(`Are you sure you want to remove ${repoName}?`)) return;
        try {
            await DefaultService.apiIntegrationGithubReposDelete({ name: repoName });
            toast.success(`Removed repository ${repoName}`);
            fetchData();
        } catch (err: any) {
            toast.error(`Failed to remove ${repoName}: ` + err.message);
        }
    };

    const handleBulkDelete = async (selectedItems: FlatMappedRepo[]) => {
        const selectionByRepo: Record<string, string[]> = {};
        selectedItems.forEach(item => {
            if (!selectionByRepo[item.repository]) {
                selectionByRepo[item.repository] = [];
            }
            selectionByRepo[item.repository].push(item.branch);
        });

        const repos = Object.keys(selectionByRepo);
        if (repos.length === 0) return;

        const operations: { type: 'delete' | 'update', repo: string, branches?: string[] }[] = [];
        let totalBranchesToRemove = 0;
        let fullRepoDeletions = 0;

        repos.forEach(repo => {
            const selectedBranches = selectionByRepo[repo];
            const allBranches = data.allowed_branches[repo] || [];
            const selectedSet = new Set(selectedBranches);
            const remainingBranches = allBranches.filter((b: string) => !selectedSet.has(b));

            if (remainingBranches.length === 0) {
                operations.push({ type: 'delete', repo });
                fullRepoDeletions++;
            } else {
                operations.push({ type: 'update', repo, branches: remainingBranches });
            }
            totalBranchesToRemove += selectedBranches.length;
        });

        const confirmMessage = fullRepoDeletions === repos.length
            ? `Are you sure you want to remove ${fullRepoDeletions} repositories? This action cannot be undone.`
            : `Are you sure you want to remove ${totalBranchesToRemove} branches across ${repos.length} repositories?`;

        if (!confirm(confirmMessage)) return;

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const op of operations) {
            try {
                if (op.type === 'delete') {
                    await DefaultService.apiIntegrationGithubReposDelete({ name: op.repo });
                } else if (op.type === 'update' && op.branches) {
                    await DefaultService.apiIntegrationGithubReposPut({
                        requestBody: { name: op.repo, branches: op.branches }
                    });
                }
                successCount++;
            } catch (err) {
                console.error(`Failed to process ${op.repo}`, err);
                failCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully processed ${successCount} operations`);
        }
        if (failCount > 0) {
            toast.error(`Failed to complete ${failCount} operations. Check console for details.`);
        }

        fetchData();
    };

    const handleEditRepo = (repoName: string) => {
        const branches = data.allowed_branches[repoName] || [];
        const currentPatId = data.repo_pats ? data.repo_pats[repoName] : null;
        setEditingRepo({ name: repoName, branches, pat_id: currentPatId });
        setIsAddRepoOpen(true);
    };

    const flatData = useMemo(() => {
        if (!data || !data.allowed_branches) return [];

        const result: FlatMappedRepo[] = [];
        Object.entries(data.allowed_branches).forEach(([repo, branches]: [string, any]) => {
            const details = detailedPermissions[repo];

            branches.forEach((branch: string) => {
                result.push({
                    id: `${repo}:${branch}`,
                    repository: repo,
                    branch: branch,
                    status: 'Active',
                    permissionInfo: details ? (
                        <div className="flex items-center gap-3">
                            {details.accessible && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                    <Eye className="h-3 w-3" /> Accessible
                                </span>
                            )}
                            {details.can_post_comments && (
                                <span className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                    <MessageSquare className="h-3 w-3" /> Can Comment
                                </span>
                            )}
                            {!details.accessible && !details.can_post_comments && (
                                <span className="text-[10px] text-muted-foreground italic">No detailed info</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] text-muted-foreground animate-pulse">Checking access...</span>
                    )
                });
            });
        });
        return result;
    }, [data, detailedPermissions]);

    const filteredData = useMemo(() => {
        return flatData.filter(item =>
            item.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.branch.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [flatData, searchTerm]);

    const columns = [
        {
            header: 'Repository',
            accessor: 'repository',
            cell: (row: FlatMappedRepo) => (
                <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 text-primary/70" />
                    <span className="font-bold text-foreground">{row.repository}</span>
                </div>
            )
        },
        {
            header: 'Branch',
            accessor: 'branch',
            cell: (row: FlatMappedRepo) => (
                <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">
                        {row.branch}
                    </Badge>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            cell: (row: FlatMappedRepo) => (
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-tighter">
                        {row.status}
                    </span>
                </div>
            )
        },
        {
            header: 'Permission Info',
            accessor: 'permissionInfo',
            cell: (row: FlatMappedRepo) => row.permissionInfo
        },
        {
            header: 'Credentials',
            accessor: 'credentials',
            cell: (row: FlatMappedRepo) => {
                const patId = data?.repo_pats ? data.repo_pats[row.repository] : null;
                if (!patId) return <Badge variant="outline" className="text-muted-foreground text-[10px]">Active PAT (Default)</Badge>;

                const pat = pats.find(p => p.id === patId);
                return (
                    <div className="flex items-center gap-1.5">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-foreground">{pat ? pat.name : 'Unknown PAT'}</span>
                        {pat && !pat.active && <Badge variant="destructive" className="h-4 px-1 text-[9px]">Inactive</Badge>}
                    </div>
                )
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (row: FlatMappedRepo) => (
                <div className="flex justify-center pr-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-md border-border/50 shadow-xl">
                            <DropdownMenuItem
                                onClick={() => navigate(`/settings/ci_cd/source_control/${row.repository}/${row.branch}`)}
                                className="gap-2 text-[12px] font-medium py-2 cursor-pointer"
                            >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                View Builds
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleEditRepo(row.repository)}
                                className="gap-2 text-[12px] font-medium py-2 cursor-pointer"
                            >
                                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Branches
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleSyncRepo(row.repository)}
                                disabled={refreshing[row.repository]}
                                className="gap-2 text-[12px] font-medium py-2 cursor-pointer"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing[row.repository] ? 'animate-spin' : ''}`} />
                                Refresh Access
                            </DropdownMenuItem>
                            <div className="h-px bg-border/40 my-1" />
                            <DropdownMenuItem
                                onClick={() => handleDeleteRepo(row.repository)}
                                className="gap-2 text-[12px] font-medium py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove Repo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <PageLayout
            title="Source Control"
            subtitle="Manage repositories and their allowed branches to trigger Continuous Integration (CI) workflows via SCM polling."
            icon={Plug}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={loading} className="text-xs">
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        onClick={() => setIsAddRepoOpen(true)}
                        className="text-xs font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Repository
                    </Button>
                </div>
            }
        >
            {/* Hero Stats Section */}
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Repositories"
                    count={data?.allowed_branches ? Object.keys(data.allowed_branches).length : 0}
                    icon={<Plug className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Branches"
                    count={flatData.length}
                    icon={<GitBranch className="w-4 h-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Accessible"
                    count={Object.values(detailedPermissions).filter((d: any) => d.accessible).length}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Polling"
                    count={data?.enabled ? "Enabled" : "Disabled"}
                    icon={<RefreshCw className={`w-4 h-4 ${data?.enabled ? 'animate-spin-slow' : ''}`} />}
                    color={data?.enabled ? "bg-amber-500" : "bg-muted-foreground"}
                    className={`${data?.enabled ? "border-amber-500/20 bg-amber-500/5" : "border-border/50 bg-muted/5"} shadow-none hover:border-amber-500/30 transition-all`}
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 flex flex-col space-y-4 pt-4">
                <ResourceTable
                    title="Active Repositories"
                    description="Configure which repositories and branches are allowed to trigger build, test, and deployment processes."
                    icon={<Plug className="h-4 w-4" />}
                    columns={columns}
                    data={filteredData}
                    onBulkDelete={handleBulkDelete}
                    loading={loading}
                    extraHeaderContent={
                        <div className="relative w-64 mr-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search repo or branch..."
                                className="pl-8 h-8 text-[11px] bg-muted/40 border-border/40 focus-visible:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    }
                />
            </div>

            <FormWizard
                name="add-repository-wizard"
                isWizardOpen={isAddRepoOpen}
                setIsWizardOpen={setIsAddRepoOpen}
                steps={repoSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                initialValues={repoInitialValues}
                schema={repoSchema}
                onSubmit={handleRepoSubmit}
                heading={{
                    primary: editingRepo ? 'Edit Repository' : 'Add Repository',
                    secondary: editingRepo
                        ? `Configure branches for ${editingRepo.name}`
                        : 'Configure a new repository for source control polling.',
                    icon: Plug,
                }}
                submitLabel={editingRepo ? 'Save Changes' : 'Add Repository'}
                submitIcon={Plug}
            />
        </PageLayout>
    );
};

export default SourceControlPage;

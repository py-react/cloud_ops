import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Plug,
  Plus,
  Settings,
  GitBranch,
  Shield,
  Webhook,
  CheckCircle,
  XCircle,
  FolderGit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import RouteDescription from '@/components/route-description';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import AddRepositoryForm from '@/components/ciCd/sourceControl/github/forms/AddRepositoryForm';
import ManagePatsDialog from '@/components/ciCd/sourceControl/github/ManagePatsDialog';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WebhookConfig {
  status: string;
  supported_events: string[];
  allowed_repositories: Record<string, string>;
  allowed_branches: Record<string, string[]>;
  timestamp: string;
}

interface Repository {
  name: string;
  allowedBranches: string[];
  status: 'active' | 'inactive';
  supportedEvents: string[];
}

interface EnhancedRepository extends Omit<Repository, 'allowedBranches' | 'supportedEvents' | 'status'> {
  allowedBranches: React.ReactElement;
  supportedEvents: React.ReactElement;
  status: React.ReactElement;
  data: Repository
}

const IntegrationsPage = () => {
  const navigate = useNavigate()
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRepo,setEditingRepor] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<EnhancedRepository | null>(null);
  const [repoAccess, setRepoAccess] = useState<Record<string, any>>({});

  const fetchWebhookConfig = async () => {
    try {
      const res = await DefaultService.apiIntegrationGithubPollingGet();
      const data = res as any;
      // adapt polling response to previous webhook config shape
      setWebhookConfig({
        status: data.status,
        supported_events: ['pull_request'],
        allowed_repositories: data.allowed_repositories,
        allowed_branches: data.allowed_branches,
        timestamp: data.timestamp,
      });
      // kick off access checks for configured repos
      try {
        const repoNames = Object.keys(data.allowed_repositories || {});
        for (const rn of repoNames) {
          fetchRepoAccess(rn);
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhook configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoAccess = async (repoName: string) => {
    try {
      const r = await fetch(`/api/integration/github/polling/access?name=${encodeURIComponent(repoName)}`);
      if (!r.ok) {
        const txt = await r.text();
        setRepoAccess(prev => ({ ...prev, [repoName]: { error: txt } }));
        return;
      }
      const json = await r.json();
      setRepoAccess(prev => ({ ...prev, [repoName]: json }));
    } catch (err: any) {
      setRepoAccess(prev => ({ ...prev, [repoName]: { error: err?.message || String(err) } }));
    }
  }

  useEffect(() => {

    fetchWebhookConfig();
  }, []);

  // Transform API data to repository format
  const repositories: Repository[] = webhookConfig ? Object.entries(webhookConfig.allowed_repositories).map(([repoName, repoId]) => ({
    name: repoName,
    allowedBranches: webhookConfig.allowed_branches[repoName] || [],
    status: 'active' as const,
    supportedEvents: webhookConfig.supported_events
  })) : [];

  const columns = [
    { header: 'Repository', accessor: 'name' },
    { header: 'Branches', accessor: 'allowedBranches' },
    { header: 'Status', accessor: 'status' },
  ];


  const handleEdit = (repository: EnhancedRepository) => {
    console.log('Edit repository:', repository.data);
    setEditingRepor({
      name:repository.data.name,
      branches:repository.data.allowedBranches.map(item=>({value:item}))
    })
    setAddDialogOpen(true)
  };

  const handleDelete = async (repository: EnhancedRepository) => {
    // Open confirmation dialog
    setRepoToDelete(repository);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!repoToDelete) return;
    const repository = repoToDelete;
    try {
      const res = await DefaultService.apiIntegrationGithubPollingDelete({ name: repository.data.name })
      const body: any = res as any
      if (body && body.success) {
        toast.success(`Repository ${repository.data.name} removed from SCM polling.`)
        fetchWebhookConfig()
      } else {
        toast.error((body && body.message) || 'Failed to remove repository from SCM polling')
      }
    } catch (err: any) {
      toast.error(err.message || String(err))
    } finally {
      setDeleteDialogOpen(false);
      setRepoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setRepoToDelete(null);
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDetails = (repo: any,branch:string) => {
    navigate(`/settings/ci_cd/source_control/${repo.name}/${branch}`)
  };

  const enhancedData: EnhancedRepository[] = repositories.map(repository => ({
    ...repository,
    data:repository,
    allowedBranches: (
      <div className="flex flex-wrap gap-1">
        {repository.allowedBranches.map((branch, i) => (
          <span onClick={()=>{
            handleViewDetails(repository,branch)
          }} key={i} className="inline-flex items-center px-2 py-1 cursor-pointer rounded text-base bg-green-100 text-green-800">
            {branch}
          </span>
        ))}
      </div>
    ),
    supportedEvents: (
      <div className="flex flex-wrap gap-1">
        {repository.supportedEvents.map((event, i) => (
          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {event}
          </span>
        ))}
      </div>
    ),
    status: (
      <div className="flex items-center gap-2">
        {getStatusIcon(repository.status)}
        <span className="capitalize">{repository.status}</span>
        {/* access info */}
        {repoAccess[repository.name] && (
          <div className="ml-4 text-xs text-slate-500">
            {repoAccess[repository.name].error ? (
              <span className="text-red-600">Access check failed</span>
            ) : (
              <>
                <span className={repoAccess[repository.name].accessible ? 'text-green-600' : 'text-red-600'}>
                  {repoAccess[repository.name].accessible ? 'Accessible' : 'No Access'}
                </span>
                {' • '}
                <span>{repoAccess[repository.name].can_post_comments ? 'Can comment' : 'Cannot comment'}</span>
                {' '}
                <Button size="xs" className="ml-2" onClick={() => fetchRepoAccess(repository.name)}>Refresh</Button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }));

  if (loading) {
    return (
      <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading SCM polling configuration...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div title="Integrations">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Plug className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Source Control
                </h2>
                <p className="text-base text-slate-500">
                  Repository Configuration
                </p>
              </div>
            </div>
          }
          shortDescription=""
          description="Manage repositories and their allowed branches to trigger Continuous Integration (CI) workflows via SCM polling. Only specified repositories and branches will be permitted to initiate build, test, and deployment processes."
        />

        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderGit className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    Active Repositories
                  </h2>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plug className="h-5 w-5" />
                        Add Repository
                    </Button>
                  </DialogTrigger>
                  <div className="ml-2">
                    <ManagePatsDialog />
                  </div>
                  <DialogContent className="max-w-none  w-screen h-screen flex flex-col">
                    <DialogHeader className="py-4 px-6 border-b">
                      <DialogTitle className="flex gap-2 items-center">
                        {" "}
                        <Plug className="w-4 h-4" />
                        Add Repository
                      </DialogTitle>
                      <DialogDescription>
                        Add a new GitHub repository and configure allowed
                        branches.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                      <AddRepositoryForm
                        onSuccess={() => {
                          setAddDialogOpen(false);
                          setEditingRepor({});
                          fetchWebhookConfig();
                        }}
                        initialValues={editingRepo}
                        isEdit={!!Object.keys(editingRepo).length}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                {/* Delete confirmation dialog (styled) */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove repository from SCM polling</DialogTitle>
                      <DialogDescription>
                        {repoToDelete ? (
                          <>This will stop polling PRs for <strong>{repoToDelete.data.name}</strong> on the configured branches.</>
                        ) : 'Confirm removal from SCM polling.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end mt-4">
                      <DialogClose asChild>
                        <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
            <CardDescription>
              Configure which repositories and branches are allowed to trigger
              build, test, and deployment processes.
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none p-0">
            <ResourceTable
              columns={columns}
              data={enhancedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegrationsPage;
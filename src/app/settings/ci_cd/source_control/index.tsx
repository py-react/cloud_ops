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

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch('/api/integration/github/webhook');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWebhookConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhook configuration');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = (repository: EnhancedRepository) => {
    console.log('Delete repository:', repository.name);
    DefaultService.apiIntegrationGithubWebhookDelete({name:repository.data.name}).then(res=>{
      if(res.success){
        toast.success(res.message)
        fetchWebhookConfig()
      }else{
        toast.error(res.message)
      }
    }).catch(err=>{
      toast.error(err.message)
    })
    // Implement delete functionality
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
      </div>
    )
  }));

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading webhook configuration...</div>
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
          description="Manage repositories and their allowed branches to trigger Continuous Integration (CI) workflows through GitHub webhooks. Only specified repositories and branches will be permitted to initiate build, test, and deployment processes."
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
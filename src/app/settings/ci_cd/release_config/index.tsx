import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileCog } from 'lucide-react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import RouteDescription from '@/components/route-description';
import { ReleaseConfigDetails } from '../../../../components/ciCd/releaseConfig/ReleaseConfigDetails';

// Placeholder for ReleaseConfigForm
const ReleaseConfigForm = ({ onSuccess, initialValues, isEdit }: any) => (
  <div className="p-6 text-gray-500">
    ReleaseConfigForm goes here.
    <Button variant="outline" className="mt-4" onClick={onSuccess}>
      Cancel
    </Button>
  </div>
);

const columns = [
  { header: 'Repository', accessor: 'repo' },
  { header: 'Namespace', accessor: 'namespace' },
  { header: 'Deployment Name', accessor: 'deployment_name' },
];

function renderDeploymentInfo(deployment: any) {
  if (!deployment) return null;
  return (
    <div className="space-y-1">
      {['stage', 'dev', 'prod'].map(env => (
        <div key={env} className="text-xs">
          Env: <span className="font-semibold capitalize">{env || '-'}</span> <br />
          Tag: <span className="font-mono">{deployment[env]?.tag || '-'}</span><br />
        </div>
      ))}
    </div>
  );
}

const ReleaseConfigPage = () => {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [viewConfig, setViewConfig] = useState<any | null>(null);

  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/integration/github/webhook');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        // deployments is an object: { repo: { ...deploymentInfo } }
        const deploymentsArr = Object.entries(data.deployments || {}).map(([repo, info]: [string, any]) => ({
          repo,
          ...info
        }));
        setDeployments(deploymentsArr);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch release configs');
      } finally {
        setLoading(false);
      }
    };
    fetchDeployments();
  }, []);

  const enhancedData = deployments.map((item: any) => ({
    ...item,
    fullData:item,
    last_deployment: renderDeploymentInfo(item.last_deployment),
    current_deployment: renderDeploymentInfo(item.current_deployment),
  }));

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading release configs...</div>
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
    <div title="Release Configurations" className="p-4 w-full">
      <div className="space-y-6">
        <RouteDescription
          title={<span className="flex items-center gap-2"><FileCog className="h-4 w-4" /> Release Configurations</span>}
          shortDescription="Define the configuration needed to deploy your service, including metadata for traceability."
          description="Define the parameters and metadata required for this deployment. This may include the deployment name, container image, pull request URL, Jira ticket, and other contextual information used to identify and track this release."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center justify-between">
                <h2>Active Release Configs</h2>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
                      <FileCog className="h-4 w-4" />
                      Add Release Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-none w-screen h-screen flex flex-col">
                    <DialogHeader>
                      <DialogTitle>{editingConfig && editingConfig.name ? 'Edit Release Config' : 'Add Release Config'}</DialogTitle>
                      <DialogDescription>
                        Configure a new release environment and deployment settings.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                      <ReleaseConfigForm onSuccess={() => {
                        setAddDialogOpen(false);
                        setEditingConfig({});
                        // Refresh configs if needed
                      }} initialValues={editingConfig} isEdit={!!editingConfig && !!editingConfig.name} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
            <CardDescription>
              Configure which release environments are available for deployments.
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none p-0">
            <ResourceTable
              columns={columns}
              data={enhancedData}
              onEdit={() => {}}
              onDelete={() => {}}
              onViewDetails={(row)=>{
                setViewConfig(row.fullData);
              }}
              className="mt-4"
            />
          </CardContent>
        </Card>
        {/* Full window modal for viewing config details */}
        <ReleaseConfigDetails open={!!viewConfig} onClose={() => setViewConfig(null)} config={viewConfig} />
      </div>
    </div>
  );
};

export default ReleaseConfigPage;
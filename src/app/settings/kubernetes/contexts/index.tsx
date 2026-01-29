import React, { useContext } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Server,
  Users,
  Folder,
  Database,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { KubeContextSwitcher } from '@/components/kubernetes/KubeContextSwitcher';
import { KubeContext } from "@/components/kubernetes/contextProvider/KubeContext";
import { KubeContextTable } from '@/components/kubernetes/settings/contexts/list/kubeContextTable';
import PageLayout from '@/components/PageLayout';
import ResourceCard from '@/components/kubernetes/dashboard/resourceCard';
import { Button } from '@/components/ui/button';
function KubernetesSettings() {
  const {
    currentKubeContext,
    fetchconfig,
    config,
    isLoading
  } = useContext(KubeContext);

  return (
    <PageLayout
      title="Kubernetes Contexts"
      subtitle={
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1">
            Manage your Kubernetes contexts—view, edit, and switch between different cluster configurations.
          </p>
          {currentKubeContext && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                <Layers className="h-3 w-3" />
                {currentKubeContext.name}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-600">
                <Server className="h-3 w-3" />
                {currentKubeContext.context.cluster}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[11px] font-medium text-green-600">
                <Users className="h-3 w-3" />
                {currentKubeContext.context.user}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[11px] font-medium text-orange-600">
                <Folder className="h-3 w-3" />
                {currentKubeContext.context.namespace || "default"}
              </div>
            </div>
          )}
        </div>
      }
      icon={Layers}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <KubeContextSwitcher />
          <Button variant="outline" onClick={fetchconfig} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total Contexts"
            count={config?.length || 0}
            icon={<Layers className="w-4 h-4" />}
            color="bg-purple-500"
            className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
            isLoading={isLoading}
          />
        </div>

        <KubeContextTable />
      </div>
    </PageLayout>
  );
}

export default KubernetesSettings
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
} from 'lucide-react';
import { KubeContextSwitcher } from '@/components/kubernetes/KubeContextSwitcher';
import { KubeContext } from "@/components/kubernetes/context/KubeContext";
import { KubeContextList } from '@/components/kubernetes/settings/kubeContextList';
import RouteDescription from '@/components/route-description';

export const Contexts = () => {
  const {
    currentKubeContext
  } = useContext(KubeContext);

  return (
    <div title="Kubernetes Contexts">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Folder className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Kubernetes Context management</h1>
        </div>

        <div className="flex gap-3">
          <KubeContextSwitcher />
        </div>
      </div>

      <div className="space-y-6">
        <RouteDescription
          title="Context"
          shortDescription='Manage your Kubernetes contexts—view, edit, and switch between different cluster configurations from a single interface.'
          description='lets you define and switch between multiple Kubernetes cluster configurations. Each context includes a cluster, a user, and a namespace, making it easy to manage connections to different environments like dev, staging, or production.'
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Current Context</CardTitle>
            <CardDescription>
              The active Kubernetes context being used for all operations
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none">
            {currentKubeContext ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Context Name
                  </div>
                  <div className="font-medium flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {currentKubeContext.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Cluster</div>
                  <div className="font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {currentKubeContext.context.cluster}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">User</div>
                  <div className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {currentKubeContext.context.user}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Namespace</div>
                  <div className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {currentKubeContext.context.namespace}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No context selected. Please select or create a context.
              </div>
            )}
          </CardContent>
        </Card>
        <KubeContextList />
      </div>
    </div>
  );
};

export default Contexts;
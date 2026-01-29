import React, { useContext, useEffect, useState } from "react";
import {
  Search,
  Layers,
  Server,
  Users,
  Folder,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { KubeContext } from "@/components/kubernetes/contextProvider/KubeContext";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from '@/components/ui/input';
import CreateContext from '@/components/kubernetes/settings/contexts/forms/createContext';


const columns = [
  { header: "Name", accessor: "name" },
  { header: "Cluster", accessor: "clusterName" },
  { header: "Server", accessor: "clusterServer" },
  { header: "User", accessor: "userName" },
  { header: "Namespace", accessor: "namespace" },
];

export const KubeContextTable = () => {
  const {
    isLoading: isKubeContextLoading,
    config: kubeConfig,
    currentKubeContext,
  } = useContext(KubeContext);

  const [contexts, setContexts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contexts based on search term
  const filteredContexts = contexts.filter(
    (context) =>
      (context as any).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (context as any).clusterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (context as any).namespace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!isKubeContextLoading && kubeConfig) setContexts(kubeConfig);
  }, [kubeConfig, isKubeContextLoading]);

  return (
    <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CardTitle className="text-lg">Available Contexts</CardTitle>
            {currentKubeContext && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Layers className="h-3 w-3" />
                  {currentKubeContext.name}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-600">
                  <Server className="h-3 w-3" />
                  {currentKubeContext.context.cluster}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-medium text-green-600">
                  <Users className="h-3 w-3" />
                  {currentKubeContext.context.user}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[10px] font-medium text-orange-600">
                  <Folder className="h-3 w-3" />
                  {currentKubeContext.context.namespace || "default"}
                </div>
              </div>
            )}
          </div>
          <CardDescription>All configured Kubernetes contexts</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contexts..."
              className="w-full pl-9 bg-background h-9 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CreateContext />
        </div>
      </CardHeader>
      <CardContent className="p-0 shadow-none border-t border-gray-100">
        <ResourceTable columns={columns} data={filteredContexts || []} />
      </CardContent>
    </Card>
  );
};

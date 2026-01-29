import React, { useContext, useEffect, useState } from "react";
import {
  Search,
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
          <CardTitle className="text-lg">Available Contexts</CardTitle>
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

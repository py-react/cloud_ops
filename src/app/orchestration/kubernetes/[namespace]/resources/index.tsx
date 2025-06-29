import React, { useContext, useEffect, useState } from "react";
import { ResourcesList } from "@/components/kubernetes/resources/ResourcesList";
import useNavigate from "@/libs/navigate";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import RouteDescription from "@/components/route-description";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { useParams } from "react-router-dom";

export interface ResourceInfo {
  name: string;
  kind: string;
  namespaced: boolean;
  api_version: string;
  short_names: string[];
}

export default function KubernetesResourcesPage() {
  const navigate = useNavigate();
  const {namespace} = useParams()
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/kubernertes/resources');
        if (!response.ok) throw new Error('Failed to fetch resources');
        const data = await response.json();
        setResources(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleQuickViewMatchResourceSelect = (resourceType: string)=>{
    navigate(
      `/orchestration/kubernetes/${namespace}/${resourceType.toLowerCase()}`
    );
  }
  const handleAnyDeploymentsSelect = (resourceType: string)=>{
    navigate(
      `/orchestration/kubernetes/${namespace}/deployments/${resourceType.toLowerCase()}`
    );
  }

  const resourceTypes = {
    deployments: true,
    replicasets: true,
    statefulsets: true,
    daemonsets: true,
    configmaps: true,
    pods: true,
    secrets: true,
    services: true,
    ingresses: true,
    certificates: true,
    issuers: true,
  } as const;

  const handleResourceSelect = (resourceType: string) => {
    const normalizedType = resourceType.toLowerCase();
    
    if (normalizedType in resourceTypes) {
      if(["deployments","replicasets","statefulsets","daemonsets"].includes(normalizedType)){
        handleAnyDeploymentsSelect(normalizedType);
      }else{
        handleQuickViewMatchResourceSelect(resourceType);
      }
    } else {
      navigate(
        `/orchestration/kubernetes/${namespace}/resources/${normalizedType}`
      );
    }
  };


  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.kind.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.api_version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.short_names.includes(searchTerm)
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              <h2>Resources</h2>
            </div>
          }
          shortDescription="Browse all available Kubernetes resources—click any resource type to view and manage its corresponding objects."
          description="Resources are declarative objects that represent the desired state and configuration of your cluster. These include core components like Pods, Services, ConfigMaps, and more, each serving a specific role in the system. Resources are defined and managed through the Kubernetes API and reflect everything from workload execution to networking and configuration."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Resources</CardTitle>
              <CardDescription>All resources</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none ">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ResourcesList
              resources={filteredResources}
              onSelect={handleResourceSelect}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

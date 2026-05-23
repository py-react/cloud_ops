import React, { useContext, useEffect, useState } from "react";
import { ResourcesList } from "@/components/kubernetes/resources/ResourcesList";
import useNavigate from "@/libs/navigate";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { ListIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { useParams } from "react-router-dom";
import { KubeErrorState } from "@/components/kubernetes/KubeErrorState";

export interface ResourceInfo {
  name: string;
  kind: string;
  namespaced: boolean;
  api_version: string;
  short_names: string[];
}

export default function KubernetesResourcesPage() {
  const navigate = useNavigate();
  const { namespace } = useParams()
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigMissing, setIsConfigMissing] = useState(false);



  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/kubernertes/resources');
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.message || 'Failed to fetch resources');
          } catch (e) {
            throw new Error(`Failed to fetch resources (Status ${response.status})`);
          }
        }
        const data = await response.json();
        setResources(data);
      } catch (err) {
        let message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        if (message.includes("No active Kubernetes configuration found") || message.includes("missing")) {
          setIsConfigMissing(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleQuickViewMatchResourceSelect = (resourceType: string) => {
    navigate(
      `/orchestration/kubernetes/${namespace}/${resourceType.toLowerCase()}`
    );
  }
  const handleAnyDeploymentsSelect = (resourceType: string) => {
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
      if (["deployments", "replicasets", "statefulsets", "daemonsets"].includes(normalizedType)) {
        handleAnyDeploymentsSelect(normalizedType);
      } else {
        handleQuickViewMatchResourceSelect(resourceType);
      }
    } else {
      navigate(
        `/orchestration/kubernetes/${namespace}/resources/${normalizedType}`
      );
    }
  };


  const filteredResources = React.useMemo(() => {
    if (!resources || !Array.isArray(resources)) return [];
    return resources.filter(resource =>
      (resource.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (resource.kind?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (resource.api_version?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (resource.short_names || []).some(sn => sn.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [resources, searchTerm]);

  if (error || isConfigMissing) {
    return <KubeErrorState error={error || "No active Kubernetes configuration found"} isConfigMissing={true} />;
  }

  return (
    <PageLayout
      title="Resources"
      subtitle="Browse all available Kubernetes resources—click any resource type to view and manage its corresponding objects."
      icon={ListIcon}
      actions={<NamespaceSelector />}
    >
      <ResourcesList
        title="Your Resources"
        description="All resources"
        extraHeaderContent={
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              className="w-full pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
        resources={filteredResources}
        onSelect={handleResourceSelect}
      />
    </PageLayout>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';

import { DefaultService } from '@/gingerJs_api_client';
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext';

import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector';
import PageLayout from "@/components/PageLayout";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KubeErrorState } from "@/components/kubernetes/KubeErrorState";

export default function ResourceTypePage() {
  const { resourceType } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const { isLoading: isNamespacesLoading, selectedNamespace } = useContext(NamespaceContext)
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      if (!resourceType || isNamespacesLoading) return;

      setIsLoading(true);
      try {
        const result = await DefaultService.apiKubernertesResourcesTypeGet({
          type: resourceType,
          namespace: selectedNamespace
        });

        setResources(Array.isArray(result) ? result : []);
      } catch (err: any) {
        console.error('Failed to fetch resources:', err);
        let message = "Failed to fetch resources";
        if (err.body && err.body.error) {
          message = err.body.error;
          if (err.body.is_active_config_missing) {
            setIsConfigMissing(true);
          }
        } else if (err.message) {
          message = err.message;
          if (message.includes("No active Kubernetes configuration found")) {
            setIsConfigMissing(true);
          }
        }
        setError(message);
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [resourceType, isNamespacesLoading, selectedNamespace]);

  const _columns = React.useMemo(() => {
    if (isLoading || !resources || resources.length === 0 || !resources[0].metadata) {
      return [];
    }
    return Object.keys(resources[0].metadata).reduce((acc, item) => {
      if (["managedfields", "labels", "annotations", "uid", "resourceversion"].includes(item.toLowerCase())) return acc;
      acc.push({ accessor: `metadata.${item}`, header: item.toUpperCase() });
      return acc;
    }, [] as { header: string; accessor: string }[]);
  }, [isLoading, resources]);

  const filteredResources = React.useMemo(() => {
    if (!resources || !Array.isArray(resources)) return [];
    return resources.filter(
      (resource) =>
        resource.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  if (error) {
    return <KubeErrorState error={error} isConfigMissing={isConfigMissing} />;
  }

  return (
    <PageLayout
      title={`Resource Type: ${resourceType}`}
      subtitle={`View and manage all ${resourceType} in your cluster.`}
      actions={<NamespaceSelector />}
    >
      <ResourceTable
        title={`Your ${resourceType}`}
        description={`Total ${filteredResources.length} found`}
        extraHeaderContent={
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${resourceType}...`}
              className="w-full pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
        columns={_columns}
        data={filteredResources}
        loading={isLoading}
      />
    </PageLayout>
  );
} 
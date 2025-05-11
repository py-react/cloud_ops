import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ResourceTable } from './resourceTable';

interface ResourceInfo {
  name: string;
  kind: string;
  namespaced: boolean;
  api_version: string;
  short_names: string[];
}

export function ResourcesList({ onSelect }: { onSelect: (resourceType: string) => void }) {
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

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

  const filteredResources = resources.filter(resource => 
    resource.name.toLowerCase().includes(filter.toLowerCase()) ||
    resource.kind.toLowerCase().includes(filter.toLowerCase()) ||
    resource.api_version.toLowerCase().includes(filter.toLowerCase())||
    resource.short_names.includes(filter)
  );

  const columns = [
    { header: 'Kind', accessor: 'kind' },
    { header: 'Name', accessor: 'name' },
    { header: 'API Version', accessor: 'api_version' },
    { header: 'Short Names', accessor: 'short_names' },
    { header: 'Namespaced', accessor: 'namespaced' },
  ];

  const tableData = filteredResources.map(resource => ({
    ...resource,
    short_names: resource.short_names.length > 0 ? resource.short_names.join(",") : ['—'],
    namespaced: resource.namespaced ? 'Yes' : 'No',
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex align-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-9"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <ResourceTable 
        columns={columns} 
        data={tableData}
        onViewDetails={(resource) => onSelect(resource.name)} 
      />
    </div>
  );
}
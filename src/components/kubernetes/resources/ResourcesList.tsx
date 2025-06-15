import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ResourceTable } from './resourceTable';

export interface ResourceInfo {
  name: string;
  kind: string;
  namespaced: boolean;
  api_version: string;
  short_names: string[];
}

export function ResourcesList({ resources, onSelect }: { resources: ResourceInfo[], onSelect: (resourceType: string) => void }) {

  const columns = [
    { header: 'Kind', accessor: 'kind' },
    { header: 'Name', accessor: 'name' },
    { header: 'API Version', accessor: 'api_version' },
    { header: 'Short Names', accessor: 'short_names' },
    { header: 'Namespaced', accessor: 'namespaced' },
  ];

  const tableData = resources.map(resource => ({
    ...resource,
    short_names: resource.short_names.length > 0 ? resource.short_names.join(",") : ['—'],
    namespaced: resource.namespaced ? 'Yes' : 'No',
  }));

  return (
    <ResourceTable
      columns={columns}
      data={tableData}
      onViewDetails={(resource) => onSelect(resource.name)}
      tableClassName="max-h-[490px]"
    />
  );
}
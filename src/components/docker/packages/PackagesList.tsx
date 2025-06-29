import React from 'react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import type { PackageInfo } from 'src/types/package';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { TooltipWrapper } from '@/components/ui/tooltip';

// Utility function to format size into readable units (KB, MB, GB)
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

export interface PackageTableData {
  id: string;
  image: string;
  created: string;
  size: string;
  tags: React.ReactNode;
  package: PackageInfo;
}

interface PackagesListProps {
  packages: PackageInfo[];
  onPlay?: (pkg: PackageTableData) => void;
  onDelete?: (pkg: PackageTableData) => void;
}

export function PackagesList({ packages, onPlay, onDelete }: PackagesListProps) {
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Image', accessor: 'image' },
    { header: 'Created At', accessor: 'created' },
    { header: 'Size', accessor: 'size' },
    { header: 'Tags', accessor: 'tags' },
  ];

  const data: PackageTableData[] = packages.map((pkg) => ({
    id: pkg.id.substring(0, 12),
    image: pkg.name,
    created: formatDistanceToNow(new Date(pkg.created), { addSuffix: true }),
    size: formatSize(pkg.virtual_size),
    tags: (
      <div className="flex flex-wrap gap-1">
        {pkg.tags?.length ? pkg.tags.map((tag) => (
          <TooltipWrapper content={tag.split(":")[1]}>
            <span  key={tag} className="truncate w-[120px]">{tag.split(":")[1]}</span>
          </TooltipWrapper>
        )) : <em>None</em>}
      </div>
    ),
    package: pkg,
  }));

  return (
    <ResourceTable
      columns={columns}
      data={data}
      onPlay={onPlay}
      onDelete={onDelete}
      tableClassName="max-h-[490px]"
    />
  );
}
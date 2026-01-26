import React from 'react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import type { PackageInfo } from 'src/types/package';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { TooltipWrapper } from '@/components/ui/tooltip';

// Utility function to format size into readable units (KB, MB, GB)
const formatSize = (bytes: number) => {
  if (isNaN(bytes) || bytes === null || bytes === undefined) return 'Unknown';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

export interface PackageTableData {
  id: React.ReactNode;
  image: React.ReactNode;
  created: React.ReactNode;
  size: React.ReactNode;
  tags: React.ReactNode;
  package: PackageInfo;
}

interface PackagesListProps {
  packages: PackageInfo[];
  onPlay?: (pkg: PackageTableData) => void;
  onDelete?: (pkg: PackageTableData) => void;
  onPush?: (pkg: PackageTableData) => void;
  onBulkPlay?: (pkgs: PackageTableData[]) => void;
  onBulkDelete?: (pkgs: PackageTableData[]) => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PackagesList({ packages, onPlay, onDelete, onPush, onBulkPlay, onBulkDelete, title, description, icon }: PackagesListProps) {
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Image', accessor: 'image' },
    { header: 'Created At', accessor: 'created' },
    { header: 'Size', accessor: 'size' },
    { header: 'Tags', accessor: 'tags' },
  ];

  const data: PackageTableData[] = packages.map((pkg) => ({
    id: (
      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground whitespace-nowrap">
        {pkg.id.substring(0, 12)}
      </code>
    ),
    image: (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm text-foreground tracking-tight">{pkg.name}</span>
      </div>
    ),
    created: (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(pkg.created), { addSuffix: true })}
      </span>
    ),
    size: (
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {formatSize(pkg.size || pkg.virtual_size || 0)}
      </span>
    ),
    tags: (
      <div className="flex flex-wrap gap-1">
        {pkg.tags?.length ? pkg.tags.map((tag) => {
          const tagName = tag.includes(':') ? tag.split(":")[1] : tag;
          return (
            <TooltipWrapper key={tag} content={tag}>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 font-medium lowercase bg-muted/30 text-muted-foreground border-border/50 truncate max-w-[100px]">
                {tagName}
              </Badge>
            </TooltipWrapper>
          );
        }) : <span className="text-xs text-muted-foreground italic">None</span>}
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
      onPush={onPush}
      onBulkPlay={onBulkPlay}
      onBulkDelete={onBulkDelete}
      tableClassName="max-h-[550px]"
      title={title}
      description={description}
      icon={icon}
    />
  );
}
import React from 'react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { ContainerFilters } from '../common/ContainerFilters';
import { useContainerFilters } from '../hooks/useContainerFilters';
import { formatDistanceToNow } from 'date-fns';
import { ContainerIcon, EyeIcon, EditIcon, Terminal, Ban, TrashIcon, PlayIcon, PauseIcon, LoaderIcon } from 'lucide-react';
import type { ContainerInfo } from '@/gingerJs_api_client';
import { toast } from 'sonner';

interface ContainersTableProps {
  containers: ContainerInfo[];
  onView: (container: ContainerInfo) => void;
  onEdit: (container: ContainerInfo) => void;
  onLogs: (container: ContainerInfo) => void;
  onStop: (container: ContainerInfo) => void;
  onDelete: (container: ContainerInfo) => void;
  onRerun: (container: ContainerInfo) => void;
  onPause: (container: ContainerInfo) => void;
  onBulkRerun?: (containers: ContainerInfo[]) => void;
  onBulkPause?: (containers: ContainerInfo[]) => void;
  onBulkStop?: (containers: ContainerInfo[]) => void;
  onBulkDelete?: (containers: ContainerInfo[]) => void;
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}

export function ContainersTable({
  containers,
  onView,
  onEdit,
  onLogs,
  onStop,
  onDelete,
  onRerun,
  onPause,
  onBulkRerun,
  onBulkPause,
  onBulkStop,
  onBulkDelete,
  loading,
  onRefresh,
  title,
  description,
  icon,
  extraHeaderContent,
}: ContainersTableProps) {
  const {
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    filteredContainers,
  } = useContainerFilters(containers);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: 'containerStatus' },
    { header: 'Image', accessor: 'image' },
    { header: 'Short ID', accessor: 'id' },
    { header: 'Created', accessor: 'created' },
    { header: 'Port Mappings', accessor: 'ports' },
  ];

  const data = filteredContainers.map((container, index) => {
    // Determine which actions are available for this container
    const canRerun = !["running"].includes(container.status);
    const canPause = !["exited", "paused", "created"].includes(container.status);
    const canStop = !["exited"].includes(container.status);

    // Port mapping logic (show only first, +N more)
    const portEntries = container.ports ? Object.entries(container.ports) : [];
    let portMapping: React.ReactNode = (
      <span className="text-muted-foreground italic text-sm">Not bound</span>
    );

    if (portEntries.length > 0) {
      const [firstPort, bindings] = portEntries[0];
      let mappingText;
      if (Array.isArray(bindings) && bindings.length > 0) {
        mappingText = bindings
          .map(b => b.HostPort)
          .join(", ");
        portMapping = (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
              {mappingText}
            </span>
            <span className="text-xs text-muted-foreground">→ {firstPort}</span>
            {portEntries.length > 1 && (
              <span className="text-xs bg-muted px-1 rounded text-muted-foreground">
                +{portEntries.length - 1}
              </span>
            )}
          </div>
        );
      }
    }

    return {
      name: (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground tracking-tight">{container.name}</span>
        </div>
      ),
      containerStatus: container.status,
      id: (
        <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
          {container.id.substring(0, 12)}
        </code>
      ),
      image: (
        <div className="flex items-center gap-2 max-w-[180px]">
          <div className="p-1 rounded bg-muted/50">
            <ContainerIcon className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-sm truncate text-muted-foreground font-medium" title={container.image}>
            {container.image.split('@')[0]}
          </span>
        </div>
      ),
      created: (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(container.created), { addSuffix: true })}
        </span>
      ),
      ports: portMapping,
      container,
      showPlay: canRerun,
      showPause: canPause,
      showStop: canStop,
    };
  });

  const filtersElement = (
    <ContainerFilters
      search={search}
      onSearchChange={onSearchChange}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
    />
  );

  return (
    <ResourceTable
      columns={columns}
      data={data}
      onPlay={row => {
        onRerun(row.container)
      }}
      onPause={row => {
        onPause(row.container)
      }}
      onStop={row => {
        onStop(row.container)
      }}
      onDelete={row => {
        onDelete(row.container)
      }}
      onViewDetails={row => {
        onView(row.container)
      }}
      onEdit={row => {
        onEdit(row.container)
      }}
      onBulkPlay={rows => onBulkRerun?.(rows.map(r => r.container))}
      onBulkPause={rows => onBulkPause?.(rows.map(r => r.container))}
      onBulkStop={rows => onBulkStop?.(rows.map(r => r.container))}
      onBulkDelete={rows => onBulkDelete?.(rows.map(r => r.container))}
      tableClassName="max-h-[550px]"
      title={title}
      description={description}
      icon={icon}
      extraHeaderContent={filtersElement}
    />
  );
}

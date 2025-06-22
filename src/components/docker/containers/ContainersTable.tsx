import React from 'react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { ContainerFilters } from './common/ContainerFilters';
import { useContainerFilters } from './hooks/useContainerFilters';
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
  loading?: boolean;
  onRefresh?: () => void;
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
  loading,
  onRefresh,
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
    { header: 'ID', accessor: 'id' },
    { header: 'Created At', accessor: 'created' },
    { header: 'Started', accessor: 'started' },
    { header: 'Last Stopped', accessor: 'lastStopped' },
    { header: 'Port Mappings', accessor: 'ports' },
    // { header: 'Env', accessor: 'env' },
    { header: 'Container Status', accessor: 'containerStatus' },
  ];

  const data = filteredContainers.map((container) => {
    // Determine which actions are available for this container
    const canRerun = !["running"].includes(container.status);
    const canPause = !["exited", "paused", "created"].includes(container.status);
    const canStop = !["exited"].includes(container.status);

    // Port mapping logic (show only first, +N more)
    const portEntries = container.ports ? Object.entries(container.ports) : [];
    let portMapping = 'Not bound';
    if (portEntries.length > 0) {
      const [firstPort, bindings] = portEntries[0];
      let mapping;
      if (Array.isArray(bindings) && bindings.length > 0) {
        mapping = bindings
          .map(b => {
            const isLocal =
              !b.HostIp ||
              b.HostIp === "0.0.0.0" ||
              b.HostIp === "127.0.0.1" ||
              b.HostIp === "localhost";
            return isLocal
              ? `${b.HostPort} → ${firstPort}`
              : `${b.HostIp}:${b.HostPort} → ${firstPort}`;
          })
          .join(", ");
      } else {
        mapping = `Not bound → ${firstPort}`;
      }
      portMapping = mapping;
      if (portEntries.length > 1) {
        portMapping += `  +${portEntries.length - 1} more`;
      }
    }

    return {
      name: (
        <div className="flex items-center gap-2">
          <span className="font-medium">{container.name}</span>
        </div>
      ),
      containerStatus: container.status,
      id: container.id.substring(0, 12),
      image: (
        <span className="flex items-center gap-1">
          <ContainerIcon className="w-4 h-4" />
          {container.image}
        </span>
      ),
      created: formatDistanceToNow(new Date(container.created), {
        addSuffix: true,
      }),
      started:
        container.state?.StartedAt &&
        typeof container.state.StartedAt === "string" &&
        container.state.StartedAt !== "0001-01-01T00:00:00Z"
          ? formatDistanceToNow(new Date(container.state.StartedAt), {
              addSuffix: true,
            })
          : "-",
      lastStopped:
        container.state?.FinishedAt &&
        typeof container.state.FinishedAt === "string" &&
        container.state.FinishedAt !== "0001-01-01T00:00:00Z"
          ? formatDistanceToNow(new Date(container.state.FinishedAt), {
              addSuffix: true,
            })
          : "-",
      ports: portMapping,
      env: container.env_vars ? (
        <div className="max-w-[200px] truncate">
          {container.env_vars.slice(0, 3).map((env, i) => (
            <div key={i} className="truncate">
              {env}
            </div>
          ))}
          {container.env_vars.length > 3 && (
            <span className="text-xs text-gray-400">
              +{container.env_vars.length - 3} more
            </span>
          )}
        </div>
      ) : (
        "-"
      ),
      container,
      onPlay: canRerun
        ? () => onRerun(container)
        : () => toast.error("Container is already running"),
      onPause: canPause
        ? () => onPause(container)
        : () => toast.error("Container is not running"),
      onStop: canStop
        ? () => onStop(container)
        : () => toast.error("Container is already stopped"),
      onDelete: () => onDelete(container),
      onViewDetails: () => onView(container),
      onEdit: () => onEdit(container),
      onViewLogs: () => onLogs(container),
    };
  });

  return (
    <div className="space-y-4">
      <ContainerFilters
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />
      <ResourceTable
        columns={columns}
        data={data}
        onPlay={row => row.onPlay && row.onPlay()}
        onPause={row => row.onPause && row.onPause()}
        onStop={row => row.onStop && row.onStop()}
        onDelete={row => row.onDelete && row.onDelete()}
        onViewDetails={row => row.onViewDetails && row.onViewDetails()}
        onEdit={row => row.onEdit && row.onEdit()}
        // onViewLogs={row => row.onViewLogs && row.onViewLogs()}
        tableClassName="max-h-[490px]"
      />
    </div>
  );
} 
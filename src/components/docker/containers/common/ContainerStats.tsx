import React from 'react';
import { useContainerStats } from '@/hooks/useContainerStats';
import { Cpu, HardDrive, Network, Gauge, Loader2 } from 'lucide-react';

import { formatBytes } from '@/libs/utils';

import { cn } from 'src/libs/utils';


interface NetworkInterface {
  rx_bytes: number;
  tx_bytes: number;
}

interface IoServiceBytesRecursive {
  op: string;
  value: number;
}

interface ContainerStatsData {
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
  };
  networks: {
    [key: string]: NetworkInterface;
  };
  blkio_stats: {
    io_service_bytes_recursive?: IoServiceBytesRecursive[];
  };
}

interface ContainerStatsProps {
  containerId: string;
}

export function ContainerStats({ containerId }: ContainerStatsProps) {
  const { stats, loading, error } = useContainerStats(containerId);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading stats: {error.message}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-gray-500 p-4">
        No stats available for this container
      </div>
    );
  }

  const typedStats = stats as ContainerStatsData;

  // Calculate CPU usage
  const cpuDelta = typedStats.cpu_stats.cpu_usage.total_usage - typedStats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = typedStats.cpu_stats.system_cpu_usage - typedStats.precpu_stats.system_cpu_usage;
  const cpuPercent = ((cpuDelta / systemDelta) * 100).toFixed(2);

  // Calculate memory usage
  const memoryUsage = formatBytes(typedStats.memory_stats.usage);
  const memoryLimit = formatBytes(typedStats.memory_stats.limit);
  const memoryPercent = ((typedStats.memory_stats.usage / typedStats.memory_stats.limit) * 100).toFixed(2);

  // Calculate network I/O
  const networkStats = Object.values(typedStats.networks || {}).reduce(
    (acc: { rx: number; tx: number }, network: NetworkInterface) => {
      acc.rx += network.rx_bytes;
      acc.tx += network.tx_bytes;
      return acc;
    },
    { rx: 0, tx: 0 }
  );

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      
      <StatCard
        icon={Cpu}
        label="CPU Usage"
        value={`${cpuPercent}%`}
      />

      
      <StatCard
        icon={Gauge}
        label="Memory Usage"
        value={`${memoryPercent}%`}
        subValue={`${memoryUsage} of ${memoryLimit}`}
      />

      <StatCard
        icon={Network}
        label="Network I/O"
        value={`↑ ${formatBytes(networkStats.tx)}`}
        subValue={`↓ ${formatBytes(networkStats.rx)}`}
      />
      {typedStats.blkio_stats.io_service_bytes_recursive ?(
        <StatCard
          icon={HardDrive}
          label="Block I/O"
          value={`Read: ${formatBytes(
            typedStats.blkio_stats.io_service_bytes_recursive.find(
              (stat: IoServiceBytesRecursive) => stat.op === 'read'
            )?.value || 0
          )}`}
          subValue={`Write: ${formatBytes(
            typedStats.blkio_stats.io_service_bytes_recursive.find(
              (stat: IoServiceBytesRecursive) => stat.op === 'write'
            )?.value || 0
          )}`}
        />

      ):(
        <span>No block I/O data available</span>
      )}

    </div>
  );
}

export function StatCard({ icon: Icon, label, value, subValue, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg p-4 flex items-start gap-3",
      "border border-gray-100 shadow-sm",
      className
    )}>
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        {subValue && (
          <p className="text-sm text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );
}
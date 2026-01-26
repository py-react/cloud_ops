import { Activity, Loader2, Server, Folder, Box, Gauge } from 'lucide-react';
import React from 'react';

interface ClusterInfoProps {
  nodesCount: number;
  podsCount: number;
  runningPods: number;
  namespacesCount: number;
  isLoading: boolean;
  error: string;
}

export const ClusterInfo: React.FC<ClusterInfoProps> = ({
  nodesCount,
  podsCount,
  runningPods,
  namespacesCount,
  isLoading,
  error
}) => {
  const isHealthy = podsCount - runningPods === 0;

  const stats = [
    { label: 'Nodes', value: nodesCount, icon: Server, gradient: 'bg-gradient-blue' },
    { label: 'Namespaces', value: namespacesCount, icon: Folder, gradient: 'bg-gradient-purple' },
    { label: 'Total Pods', value: podsCount, icon: Box, gradient: 'bg-gradient-green' },
    { label: 'Running', value: `${runningPods}/${podsCount}`, icon: Gauge, gradient: 'bg-gradient-orange' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card dark:shadow-card-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">
          Cluster Overview
        </h2>
        <div
          className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs font-medium
            ${isHealthy
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`}
        >
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          {isHealthy ? 'Healthy' : 'Warning'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.gradient} shadow-sm`}>
                <stat.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {error ? (
                <span className="text-sm text-destructive">{error}</span>
              ) : isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                stat.value
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterInfo;
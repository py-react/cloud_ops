import React, { useState } from 'react';
import {
  Network,
  Globe,
  Target,
  Zap,
  Tag,
  Clock,
  Server,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bot,
  Sparkles,
  TrendingUp,
  Shield,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Router,
  Activity,
  Layers,
  ArrowRight,
  Hash,
  MapPin
} from 'lucide-react';
import { SkeletonLoader, TableSkeletonLoader, MetricSkeletonLoader, LoadingSpinner } from './loader';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm';
      case 'failed':
      case 'error':
        return 'bg-red-50 text-red-700 border border-red-200 shadow-sm';
      case 'active':
      case 'ready':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm';
      case 'clusterip':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'nodeport':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm';
      case 'loadbalancer':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      case 'externalname':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm';
      case 'headless':
        return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm';
      case 'daemonset':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm';
      case 'deployment':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'statefulset':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm';
      case 'replicaset':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      case 'tcp':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'udp':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm';
      case 'sctp':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200 shadow-sm';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)} ${className}`}>
      {status}
    </span>
  );
};

// AI Insights Component for Services
const ServiceAIInsights: React.FC<{ loading: boolean; serviceName?: string; serviceType?: string }> = ({
  loading,
  serviceName,
  serviceType
}) => (
  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">Service AI Insights</h3>
          <p className="text-sm text-cyan-100">Network analysis & traffic optimization</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner size="sm" className="text-white" />
      ) : (
        <Sparkles className="h-5 w-5 animate-pulse" />
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {loading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="animate-pulse">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 w-4 bg-white/20 rounded"></div>
                <div className="h-4 w-20 bg-white/20 rounded"></div>
              </div>
              <div className="h-3 w-full bg-white/20 rounded"></div>
            </div>
          </div>
        ))
      ) : (
        <>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Network className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">Network Health</span>
            </div>
            <p className="text-xs text-cyan-100">
              {serviceType === 'ClusterIP' ?
                `${serviceName} provides internal cluster connectivity` :
                `${serviceName} exposes services externally`
              }
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-300" />
              <span className="text-sm font-medium">Traffic Pattern</span>
            </div>
            <p className="text-xs text-cyan-100">
              Active workload targeting - traffic routing optimized
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <p className="text-xs text-cyan-100">
              Consider adding health checks for better load balancing
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// Service Type Icon
const getServiceTypeIcon = (type: string, clusterIp?: string) => {
  if (type === 'ClusterIP' && clusterIp === 'None') {
    return <Router className="h-4 w-4 text-slate-500" />;
  }
  switch (type) {
    case 'ClusterIP':
      return <Network className="h-4 w-4 text-blue-500" />;
    case 'NodePort':
      return <Globe className="h-4 w-4 text-purple-500" />;
    case 'LoadBalancer':
      return <Shield className="h-4 w-4 text-green-500" />;
    case 'ExternalName':
      return <ExternalLink className="h-4 w-4 text-cyan-500" />;
    default:
      return <Network className="h-4 w-4 text-blue-500" />;
  }
};

// Workload Row Component
const WorkloadRow: React.FC<{ workload: any }> = ({ workload }) => {
  const [expanded, setExpanded] = useState(false);

  const getWorkloadIcon = (type: string) => {
    switch (type) {
      case 'DaemonSet':
        return <Layers className="h-4 w-4 text-indigo-500" />;
      case 'Deployment':
        return <Server className="h-4 w-4 text-blue-500" />;
      case 'StatefulSet':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'ReplicaSet':
        return <Copy className="h-4 w-4 text-green-500" />;
      default:
        return <Server className="h-4 w-4 text-slate-500" />;
    }
  };

  const getWorkloadStatus = (workload: any) => {
    if (workload.type === 'DaemonSet') {
      return workload.number_ready === workload.desired_number_scheduled ? 'Ready' : 'Pending';
    }
    // Add other workload type status logic here
    return 'Running';
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-left"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {getWorkloadIcon(workload.type)}
            <span className="font-medium text-slate-900">{workload.name}</span>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={workload.type} />
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={getWorkloadStatus(workload)} />
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {workload.type === 'DaemonSet' ? (
            <span className="font-mono">
              {workload.number_ready}/{workload.desired_number_scheduled}
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {workload.creation_timestamp ?
            new Date(workload.creation_timestamp).toLocaleDateString() : 'Unknown'}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Workload Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Namespace:</span>
                    <span className="font-mono text-slate-900">{workload.namespace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-mono text-slate-900">{workload.type}</span>
                  </div>
                  {workload.type === 'DaemonSet' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Desired:</span>
                        <span className="font-mono text-slate-900">{workload.desired_number_scheduled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available:</span>
                        <span className="font-mono text-slate-900">{workload.number_available}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Selector</h5>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(workload.selector || {}).map(([key, value]) => (
                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700">
                      {key}={value}
                    </span>
                  ))}
                </div>

                {Object.keys(workload.labels || {}).length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Labels</h6>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(workload.labels).slice(0, 4).map(([key, value]) => (
                        <span key={key} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono bg-indigo-50 text-indigo-700">
                          {key}={value}
                        </span>
                      ))}
                      {Object.keys(workload.labels).length > 4 && (
                        <span className="text-xs text-slate-500 font-bold">
                          +{Object.keys(workload.labels).length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Event Type Icon
const getEventTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'normal':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-slate-400" />;
  }
};

// Event Row Component
const EventRow: React.FC<{ event: any; source?: string }> = ({ event, source }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-left"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {getEventTypeIcon(event.type)}
            <div>
              <p className="font-medium text-slate-900">{event.reason}</p>
              {source && <p className="text-xs text-slate-500">{source}</p>}
            </div>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={event.type} />
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {event.count || 1}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {event.lastTimestamp ?
            new Date(event.lastTimestamp).toLocaleString() :
            'Unknown'
          }
        </td>
        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
          {event.message}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Event Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">First Seen:</span>
                    <span className="font-mono text-slate-900">
                      {event.firstTimestamp ? new Date(event.firstTimestamp).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Seen:</span>
                    <span className="font-mono text-slate-900">
                      {event.lastTimestamp ? new Date(event.lastTimestamp).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Count:</span>
                    <span className="font-mono text-slate-900">{event.count || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Component:</span>
                    <span className="font-mono text-slate-900">
                      {event.source?.component || event.reportingComponent || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Message</h5>
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.message}</p>
                </div>

                {event.involvedObject && (
                  <div className="mt-4">
                    <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Involved Object</h6>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kind:</span>
                        <span className="font-mono text-slate-900">{event.involvedObject.kind}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-mono text-slate-900">{event.involvedObject.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const ServiceDetailedInfo = ({ data, loading, error, }) => {

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Service</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* AI Insights */}
        <ServiceAIInsights
          loading={loading.aiInsights}
          serviceName={data?.service.name}
          serviceType={data?.service.type}
        />

        {/* Service Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          {loading.service ? (
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div>
                    <div className="h-6 w-32 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <MetricSkeletonLoader key={index} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-cyan-100 rounded-xl">
                    {getServiceTypeIcon(data?.service.type || 'ClusterIP', data?.service.cluster_ip)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{data?.service.name}</h2>
                    <p className="text-sm text-slate-500">Service Resource</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={data?.service.cluster_ip === 'None' ? 'Headless' : data?.service.type || 'ClusterIP'} />
                  <span className="text-xs text-slate-500">
                    Created: {data?.service.creation_timestamp ?
                      new Date(data.service.creation_timestamp).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                    <Hash className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.service.ports.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Ports</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.service.target_workloads.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Target Workloads</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.keys(data?.service.selector || {}).length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Selectors</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                    <Tag className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.keys(data?.service.labels || {}).length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Labels</p>
                </div>
              </div>

              {/* Labels Section - Integrated into overview */}
              {data?.service.labels && Object.keys(data.service.labels).length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Service Labels</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.service.labels || {}).map(([key, value]) => (
                      <div key={key} className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-mono text-amber-700">{key}</span>
                        <span className="mx-2 text-amber-400">=</span>
                        <span className="text-xs font-mono text-amber-900 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Service Details Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Info className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Service Details</h2>
          </div>

          {loading.service ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 w-16 bg-slate-200 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Service Type */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Type</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.service.type || 'ClusterIP'}
                </p>
              </div>

              {/* Cluster IP */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cluster IP</p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.service.cluster_ip === 'None' ? (
                    <span className="text-slate-500 italic">Headless Service</span>
                  ) : (
                    data?.service.cluster_ip || 'Not assigned'
                  )}
                </p>
              </div>

              {/* Session Affinity */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Session Affinity</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.service.session_affinity || 'None'}
                </p>
              </div>

              {/* External IPs */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">External IPs</p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.service.external_ips && data.service.external_ips.length > 0 ?
                    data.service.external_ips.join(', ') :
                    <span className="text-slate-400">None</span>
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Port Configuration Section - SIMPLIFIED */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Port Configuration</h2>
              {loading.service ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.service.ports.length || 0} {data?.service.ports.length === 1 ? 'port' : 'ports'}
                </span>
              )}
            </div>
          </div>

          {loading.service ? (
            <div className="p-6">
              <SkeletonLoader rows={2} height="h-12" />
            </div>
          ) : data?.service.ports && data.service.ports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Protocol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Target Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Node Port
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.service.ports.map((port, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {port.name || `Port ${idx + 1}`}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={port.protocol} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">
                          {port.port}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">
                          {port.target_port}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {port.node_port ? (
                          <span className="font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-bold">
                            {port.node_port}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Ports Configured</p>
              <p className="text-sm">This service doesn't have any ports configured.</p>
            </div>
          )}
        </div>

        {/* Selector Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-slate-900">Selector</h2>
          </div>

          {loading.service ? (
            <SkeletonLoader rows={1} height="h-8" />
          ) : data?.service.selector && Object.keys(data.service.selector).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.service.selector).map(([key, value]) => (
                <div key={key} className="inline-flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-purple-700">{key}</span>
                  <span className="mx-2 text-purple-400">=</span>
                  <span className="text-xs font-mono text-purple-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pod selector configured</p>
            </div>
          )}
        </div>

        {/* Target Workloads Table */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">Target Workloads</h2>
              {loading.workloads ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.service.target_workloads.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.workloads ? (
            <TableSkeletonLoader />
          ) : data?.service.target_workloads && data.service.target_workloads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Ready/Desired
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.service.target_workloads.map((workload, index) => (
                    <WorkloadRow key={index} workload={workload} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Target Workloads</p>
              <p className="text-sm">This service is not targeting any workloads.</p>
            </div>
          )}
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900">Events</h2>
              {loading.events ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.service.events.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.events ? (
            <TableSkeletonLoader />
          ) : data?.service.events && data.service.events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Last Seen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.service.events.map((event, index) => (
                    <EventRow key={index} event={event} source="Service" />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Events</p>
              <p className="text-sm">No events have been recorded for this service.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
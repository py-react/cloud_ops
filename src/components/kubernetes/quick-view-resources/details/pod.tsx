import React, { useState } from 'react';
import {
  Server,
  Container,
  Network,
  HardDrive,
  Shield,
  FileText,
  Tag,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bot,
  Sparkles,
  TrendingUp,
  Zap,
  Database,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Key,
  Lock,
  Activity,
  Cpu,
  MemoryStick,
  Globe,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
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
      case 'bound':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm';
      case 'healthy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
      case 'waiting':
        return 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm';
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

// AI Insights Component for Pods
const PodAIInsights: React.FC<{ loading: boolean; podName?: string; podStatus?: string }> = ({ 
  loading, 
  podName, 
  podStatus 
}) => (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">Pod AI Insights</h3>
          <p className="text-sm text-indigo-100">Runtime analysis & optimization recommendations</p>
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
              <Activity className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">Health Status</span>
            </div>
            <p className="text-xs text-indigo-100">
              {podStatus === 'Running' ? 
                `${podName} is healthy and running optimally` : 
                `${podName} requires attention - ${podStatus?.toLowerCase()}`
              }
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-300" />
              <span className="text-sm font-medium">Resource Usage</span>
            </div>
            <p className="text-xs text-indigo-100">
              Consider setting resource limits for better scheduling
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <p className="text-xs text-indigo-100">
              Add health checks for improved reliability
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// Container Status Icon
const getContainerStatusIcon = (state: string, ready: boolean) => {
  if (state === 'running' && ready) {
    return <Play className="h-4 w-4 text-emerald-500" />;
  } else if (state === 'running' && !ready) {
    return <Pause className="h-4 w-4 text-amber-500" />;
  } else {
    return <RotateCcw className="h-4 w-4 text-slate-400" />;
  }
};

// Container Details Component
const ContainerDetails: React.FC<{ container: any; containerStatus: any }> = ({ 
  container, 
  containerStatus 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {containerStatus ? 
              getContainerStatusIcon(containerStatus?.state?.state, containerStatus?.ready) :
              <RotateCcw className="h-4 w-4 text-slate-400" />
            }
            <div>
              <h5 className="font-medium text-slate-900">{container.name}</h5>
              <p className="text-xs text-slate-600 font-mono">{container.image}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={containerStatus?.state?.state || 'Waiting'} />
            {containerStatus?.restart_count > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium">
                {containerStatus.restart_count} restarts
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ports */}
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <Network className="h-3 w-3 mr-1" />
                Ports
              </h6>
              <div className="space-y-1">
                {container.ports && container.ports.length > 0 ? (
                  container.ports.map((port: any, portIdx: number) => (
                    <div key={portIdx} className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                        {port.container_port}
                      </span>
                      <span className="text-xs text-slate-500">{port.protocol}</span>
                      {port.name && (
                        <span className="text-xs text-slate-400">({port.name})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No ports exposed</span>
                )}
              </div>
            </div>
            
            {/* Volume Mounts */}
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <HardDrive className="h-3 w-3 mr-1" />
                Volume Mounts
              </h6>
              <div className="space-y-1">
                {container.volume_mounts && container.volume_mounts.length > 0 ? (
                  container.volume_mounts.slice(0, 3).map((mount: any, mountIdx: number) => (
                    <div key={mountIdx} className="text-xs">
                      <div className="font-mono text-slate-700">{mount.name}</div>
                      <div className="text-slate-500 truncate">{mount.mount_path}</div>
                      {mount.read_only && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded">RO</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No volume mounts</span>
                )}
                {container.volume_mounts && container.volume_mounts.length > 3 && (
                  <span className="text-xs text-slate-500">+{container.volume_mounts.length - 3} more</span>
                )}
              </div>
            </div>
            
            {/* Environment Variables */}
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <Key className="h-3 w-3 mr-1" />
                Environment
              </h6>
              <div className="space-y-1">
                {container.env && container.env.length > 0 ? (
                  container.env.slice(0, 3).map((envVar: any, envIdx: number) => (
                    <div key={envIdx} className="text-xs font-mono text-slate-700">
                      {envVar.name}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No environment variables</span>
                )}
                {container.env && container.env.length > 3 && (
                  <span className="text-xs text-slate-500">+{container.env.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Resource Information */}
          {container.resources && (Object.keys(container.resources).length > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Resources</h6>
              <div className="grid grid-cols-2 gap-4">
                {container.resources.requests && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Requests</p>
                    <div className="space-y-1">
                      {container.resources.requests.cpu && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">CPU:</span>
                          <span className="font-mono text-slate-900">{container.resources.requests.cpu}</span>
                        </div>
                      )}
                      {container.resources.requests.memory && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Memory:</span>
                          <span className="font-mono text-slate-900">{container.resources.requests.memory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {container.resources.limits && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Limits</p>
                    <div className="space-y-1">
                      {container.resources.limits.cpu && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">CPU:</span>
                          <span className="font-mono text-slate-900">{container.resources.limits.cpu}</span>
                        </div>
                      )}
                      {container.resources.limits.memory && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Memory:</span>
                          <span className="font-mono text-slate-900">{container.resources.limits.memory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// PVC Row Component
const PVCRow: React.FC<{ pvc: any }> = ({ pvc }) => {
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
            <HardDrive className="h-4 w-4 text-purple-500" />
            <span className="font-medium text-slate-900">{pvc.name}</span>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={pvc.status} />
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {pvc.capacity || <span className="text-amber-600">Pending</span>}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {pvc.access_modes.join(', ')}
        </td>
        <td className="px-6 py-4 text-sm font-mono text-slate-600">
          {pvc.storage_class || 'default'}
        </td>
      </tr>
      
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Volume Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume Name:</span>
                    <span className="font-mono text-slate-900">{pvc.volume_name || 'Not bound'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Class:</span>
                    <span className="font-mono text-slate-900">{pvc.storage_class || 'default'}</span>
                  </div>
                </div>
              </div>
              
              {Object.keys(pvc.labels || {}).length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-3">Labels</h5>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(pvc.labels).slice(0, 4).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700">
                        {key}={value}
                      </span>
                    ))}
                    {Object.keys(pvc.labels).length > 4 && (
                      <span className="text-xs text-slate-500 font-bold">
                        +{Object.keys(pvc.labels).length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
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

export const PodDetailedInfo = ({data, loading, error}) => {

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Pod</h2>
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
    <div className="min-h-screen">

        {/* AI Insights */}
        <PodAIInsights 
          loading={loading} 
          podName={data?.pod.pod_name}
          podStatus={data?.pod.status}
        />

        {/* Pod Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          {loading ? (
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
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Server className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{data?.pod.pod_name}</h2>
                    <p className="text-sm text-slate-500">Pod Resource</p>
                  </div>
                </div>
                <StatusBadge status={data?.pod.status || 'Unknown'} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                    <Container className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.pod.containers.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Containers</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                    <HardDrive className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.pod.related_pvcs.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">PVCs</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                    <Clock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.pod.age ? data.pod.age.split(':')[0] + 'h' : '0h'}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Age</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                    <Tag className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.keys(data?.pod.labels || {}).length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Labels</p>
                </div>
              </div>

              {/* Pod Labels - Integrated into overview */}
              {data?.pod.labels && Object.keys(data.pod.labels).length > 0 && (
                <div className="border-t border-slate-100 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Pod Labels</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.pod.labels).map(([key, value]) => (
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

        {/* Pod Details Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center space-x-3 px-6 mb-6">
            <Info className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Pod Details</h2>
          </div>

          {loading.pod ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-6 pb-6 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 w-16 bg-slate-200 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-6 pb-6 gap-6">
              {/* Node Information */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Node</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.pod.node_name || <span className="text-amber-600">Not assigned</span>}
                </p>
              </div>

              {/* IP Address */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">IP Address</p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.pod.ip || <span className="text-slate-400">Not assigned</span>}
                </p>
              </div>

              {/* Host IP */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Host IP</p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.pod.host_ip || <span className="text-slate-400">Not available</span>}
                </p>
              </div>

              {/* QoS Class */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">QoS Class</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.pod.qos_class || 'BestEffort'}
                </p>
              </div>

              {/* Service Account */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Account</p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.pod.service_account || 'default'}
                </p>
              </div>

              {/* Restart Policy */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Restart Policy</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.pod.restart_policy || 'Always'}
                </p>
              </div>

              {/* DNS Policy */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">DNS Policy</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.pod.dns_policy || 'ClusterFirst'}
                </p>
              </div>

              {/* Priority Class */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority Class</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.pod.priority_class || <span className="text-slate-400">None</span>}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Containers Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Container className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Containers</h2>
              {loading.containers ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.pod.containers.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.containers ? (
            <div className="p-6">
              <SkeletonLoader rows={3} height="h-20" />
            </div>
          ) : data?.pod.containers && data.pod.containers.length > 0 ? (
            <div className="p-6 space-y-4">
              {data.pod.containers.map((container, idx) => {
                const containerStatus = data.pod.container_statuses.find(
                  (status: any) => status.name === container.name
                );
                return (
                  <ContainerDetails
                    key={idx}
                    container={container}
                    containerStatus={containerStatus}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Container className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Containers</p>
              <p className="text-sm">This pod doesn't have any containers defined.</p>
            </div>
          )}
        </div>

        {/* Persistent Volume Claims Table */}
        {data?.pod.related_pvcs && data.pod.related_pvcs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <HardDrive className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-slate-900">Persistent Volume Claims</h2>
                {loading.pvcs ? (
                  <SkeletonLoader className="w-8" />
                ) : (
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                    {data.pod.related_pvcs.length}
                  </span>
                )}
              </div>
            </div>

            {loading.pvcs ? (
              <TableSkeletonLoader />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Access Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Storage Class
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {data.pod.related_pvcs.map((pvc, index) => (
                      <PVCRow key={index} pvc={pvc} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Volumes Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-slate-900">Volumes</h2>
              {loading.volumes ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.pod.volumes.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.volumes ? (
            <div className="p-6">
              <SkeletonLoader rows={2} height="h-16" />
            </div>
          ) : data?.pod.volumes && data.pod.volumes.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.pod.volumes.map((volume, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{volume.name}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                        {volume.type.replace('_', ' ')}
                      </span>
                    </div>
                    {volume.claim_name && (
                      <p className="text-xs text-slate-600">
                        Claim: <span className="font-mono">{volume.claim_name}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Volumes</p>
              <p className="text-sm">This pod doesn't have any volumes mounted.</p>
            </div>
          )}
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900">Events</h2>
              {loading.events ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {((data?.events || []).length + 
                    (data?.pod.related_pvcs || []).reduce((acc, pvc) => acc + (pvc.events || []).length, 0)) || 0}
                </span>
              )}
            </div>
          </div>

          {loading.events ? (
            <TableSkeletonLoader />
          ) : (
            <>
              {/* Check if we have any events */}
              {((data?.events || []).length > 0 || 
                (data?.pod.related_pvcs || []).some(pvc => (pvc.events || []).length > 0)) ? (
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
                      {/* Pod Events */}
                      {(data?.events || []).map((event, index) => (
                        <EventRow key={`pod-${index}`} event={event} source="Pod" />
                      ))}
                      
                      {/* PVC Events */}
                      {(data?.pod.related_pvcs || []).map((pvc) =>
                        (pvc.events || []).map((event, index) => (
                          <EventRow key={`pvc-${pvc.name}-${index}`} event={event} source={`PVC: ${pvc.name}`} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Events</p>
                  <p className="text-sm">No events have been recorded for this pod or its resources.</p>
                </div>
              )}
            </>
          )}
        </div> 
    </div>
  );
};
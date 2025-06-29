import React, { useState } from 'react';
import {
  FileText,
  Key,
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
  Zap,
  Database,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { LoadingSpinner, SkeletonLoader, TableSkeletonLoader, MetricSkeletonLoader } from './loader';

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

// AI Insights Component for ConfigMaps
const ConfigMapAIInsights: React.FC<{ loading: boolean; configMapName?: string }> = ({ loading, configMapName }) => (
  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">ConfigMap AI Insights</h3>
          <p className="text-sm text-blue-100">Configuration analysis & recommendations</p>
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
              <Key className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium">Configuration Health</span>
            </div>
            <p className="text-xs text-blue-100">
              {configMapName ? `${configMapName} has optimal key structure` : 'ConfigMap structure looks good'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">Usage Pattern</span>
            </div>
            <p className="text-xs text-blue-100">
              Referenced by running pods - active configuration
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <p className="text-xs text-blue-100">
              Consider environment-specific configurations
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// Data Key Display Component
const DataKeyDisplay: React.FC<{ 
  dataKey: string; 
  value: string; 
  isExpanded: boolean; 
  onToggle: () => void;
}> = ({ dataKey, value, isExpanded, onToggle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-4 w-4 text-blue-500" />
            <span className="font-mono text-sm font-medium text-slate-900">{dataKey}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy value"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title={isExpanded ? "Hide value" : "Show value"}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all bg-white p-3 rounded border">
            {value}
          </pre>
          {copied && (
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ Copied to clipboard
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Referenced Pod Row Component
const ReferencedPodRow: React.FC<{ pod: any }> = ({ pod }) => {
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
            <Server className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-900">{pod.pod_name}</span>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={pod.status} />
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {pod.node_name || <span className="text-amber-600">Not assigned</span>}
        </td>
        <td className="px-6 py-4 text-sm font-mono text-slate-600">
          {pod.ip || <span className="text-slate-400">-</span>}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {pod.referenced_as.map((refType: string, idx: number) => (
              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                {refType}
              </span>
            ))}
          </div>
        </td>
      </tr>
      
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Pod Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Namespace:</span>
                    <span className="font-mono text-slate-900">{pod.namespace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Account:</span>
                    <span className="font-mono text-slate-900">{pod.service_account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Restart Policy:</span>
                    <span className="font-mono text-slate-900">{pod.restart_policy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host IP:</span>
                    <span className="font-mono text-slate-900">{pod.host_ip}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Containers</h5>
                <div className="space-y-2">
                  {pod.container_names.map((containerName: string, idx: number) => (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3">
                      <span className="text-sm font-medium text-slate-900">{containerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const ConfigDetailedInfo = ({data, loading, error}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKeyExpansion = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading ConfigMap</h2>
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
      <ConfigMapAIInsights loading={loading.aiInsights} configMapName={data?.configmap.name} />
      {/* ConfigMap Overview */}
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <MetricSkeletonLoader key={index} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {data?.configmap.name}
                  </h2>
                  <p className="text-sm text-slate-500">ConfigMap Resource</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">
                  Created:{" "}
                  {data?.configmap.creation_timestamp
                    ? new Date(
                        data.configmap.creation_timestamp
                      ).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>

            <div
              className={`grid grid-cols-2 md:grid-cols-3 gap-6 px-4 ${
                !Object.keys(data?.configmap?.labels || {}).length ? "mb-6" : ""
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.configmap.data_keys.length || 0}
                </p>
                <p className="text-sm text-slate-500 font-medium">Data Keys</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                  <Server className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.configmap.referenced_by_pods.length || 0}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Referenced Pods
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {Object.keys(data?.configmap.labels || {}).length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Labels</p>
              </div>
            </div>

            {/* Labels Section - Integrated into overview */}
            {data?.configmap.labels &&
              Object.keys(data.configmap.labels).length > 0 && (
                <div className="border-t border-slate-100 pt-6 px-6 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-slate-700">
                      Resource Labels
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.configmap.labels).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="inline-flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-2"
                        >
                          <span className="text-xs font-mono text-purple-700">
                            {key}
                          </span>
                          <span className="mx-2 text-purple-400">=</span>
                          <span className="text-xs font-mono text-purple-900 font-medium">
                            {value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {/* Data Keys Section */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 p-4 overflow-hidden">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Configuration Data
            </h2>
            {loading ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.configmap.data_keys.length || 0} keys
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={3} height="h-16" />
          </div>
        ) : data?.configmap.data_keys && data.configmap.data_keys.length > 0 ? (
          <div className="p-6 space-y-4">
            {data.configmap.data_keys.map((key) => (
              <DataKeyDisplay
                key={key}
                dataKey={key}
                value={data.configmap.data[key] || ""}
                isExpanded={expandedKeys.has(key)}
                onToggle={() => toggleKeyExpansion(key)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Configuration Data</p>
            <p className="text-sm">
              This ConfigMap doesn't contain any data keys.
            </p>
          </div>
        )}
      </div>

      {/* Referenced Pods Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 overflow-hidden">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Referenced by Pods
            </h2>
            {loading ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.configmap.referenced_by_pods.length || 0}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeletonLoader />
        ) : data?.configmap.referenced_by_pods &&
          data.configmap.referenced_by_pods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Pod Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Node
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Reference Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.configmap.referenced_by_pods.map((pod, index) => (
                  <ReferencedPodRow key={index} pod={pod} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Pod References</p>
            <p className="text-sm">
              This ConfigMap is not currently referenced by any pods.
            </p>
          </div>
        )}
      </div>
      {/* Events */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4 mb-8">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Events
            </h2>
            {loading ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.configmap?.events.length}
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-5 h-5 bg-slate-200 rounded-full mt-1"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <SkeletonLoader className="w-32" />
                      <SkeletonLoader className="w-12" />
                    </div>
                    <SkeletonLoader className="w-full" />
                    <div className="flex justify-between">
                      <SkeletonLoader className="w-24" />
                      <SkeletonLoader className="w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.configmap?.events && data?.configmap.events.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data?.configmap.events.map((event, index) => (
              <div
                key={index}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {event.type.toLowerCase() === "warning" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {event.reason}
                      </h4>
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                        {event.count}x
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {event.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{event.source}</span>
                      <span>
                        {new Date(event.lastTimestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Recent Events</p>
          </div>
        )}
      </div>
    </div>
  );
};
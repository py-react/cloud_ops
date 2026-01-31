import React, { useState } from 'react';
import {
  Lock,
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
  Shield,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText
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
      case 'opaque':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm';
      case 'kubernetes.io/tls':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'kubernetes.io/service-account-token':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      case 'kubernetes.io/dockercfg':
      case 'kubernetes.io/dockerconfigjson':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm';
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

// AI Insights Component for Secrets
const SecretAIInsights: React.FC<{ loading: boolean; secretName?: string; secretType?: string }> = ({
  loading,
  secretName,
  secretType
}) => (
  <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">Secret AI Insights</h3>
          <p className="text-sm text-purple-100">Security analysis & recommendations</p>
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
              <Shield className="h-4 w-4 text-green-300" />
              <span className="text-sm font-medium">Security Status</span>
            </div>
            <p className="text-xs text-purple-100">
              {secretType === 'kubernetes.io/tls' ?
                'TLS certificate properly configured' :
                `${secretName} follows security best practices`
              }
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium">Usage Pattern</span>
            </div>
            <p className="text-xs text-purple-100">
              Referenced by active pods - secure data in use
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Recommendation</span>
            </div>
            <p className="text-xs text-purple-100">
              Consider rotating secrets regularly for enhanced security
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// Secret Type Icon
const getSecretTypeIcon = (type: string) => {
  switch (type) {
    case 'kubernetes.io/tls':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'kubernetes.io/service-account-token':
      return <Key className="h-4 w-4 text-green-500" />;
    case 'kubernetes.io/dockercfg':
    case 'kubernetes.io/dockerconfigjson':
      return <FileText className="h-4 w-4 text-indigo-500" />;
    case 'Opaque':
    default:
      return <Lock className="h-4 w-4 text-purple-500" />;
  }
};

// Data Key Display Component for Secrets
const SecretKeyDisplay: React.FC<{
  dataKey: string;
  isExpanded: boolean;
  onToggle: () => void;
  secretType: string;
}> = ({ dataKey, isExpanded, onToggle, secretType }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // For security, we don't actually copy the real value
      await navigator.clipboard.writeText('[REDACTED - Secret value hidden for security]');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getKeyDescription = (key: string, type: string) => {
    if (type === 'kubernetes.io/tls') {
      if (key === 'tls.crt') return 'TLS Certificate';
      if (key === 'tls.key') return 'TLS Private Key';
    }
    if (type === 'kubernetes.io/service-account-token') {
      if (key === 'token') return 'Service Account Token';
      if (key === 'ca.crt') return 'CA Certificate';
      if (key === 'namespace') return 'Namespace';
    }
    if (type === 'kubernetes.io/dockerconfigjson') {
      if (key === '.dockerconfigjson') return 'Docker Config JSON';
    }
    return 'Secret Data';
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSecretTypeIcon(secretType)}
            <div>
              <span className="font-mono text-sm font-medium text-slate-900">{dataKey}</span>
              <p className="text-xs text-slate-500">{getKeyDescription(dataKey, secretType)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy placeholder (actual value hidden)"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title={isExpanded ? "Hide details" : "Show details"}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Security Notice</span>
            </div>
            <p className="text-xs text-red-600">
              Secret values are hidden for security purposes. Only authorized applications can access the actual data.
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Data Type</span>
              <StatusBadge status={secretType} />
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                {dataKey === 'tls.crt' || dataKey === 'ca.crt' ? 'X.509 Certificate' :
                  dataKey === 'tls.key' ? 'RSA Private Key' :
                    dataKey === 'token' ? 'JWT Token' :
                      dataKey === '.dockerconfigjson' ? 'JSON Configuration' :
                        'Base64 Encoded Data'}
              </span>
            </div>
          </div>

          {copied && (
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ Security placeholder copied to clipboard
            </div>
          )}
        </div>
      )}
    </div>
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
              <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
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

interface SecretsDetailedInfoProps {
  data: any;
  loading: any;
  error: any;
  onRetry?: () => void;
}

export const SecretsDetailedInfo: React.FC<SecretsDetailedInfoProps> = ({ data, loading, error, onRetry }) => {
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Secret</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={onRetry}
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
      <SecretAIInsights
        loading={loading.aiInsights}
        secretName={data?.secret.name}
        secretType={data?.secret.type}
      />
      {/* Secret Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        {loading.secret ? (
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
            <div className="flex items-center justify-between p-4 mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  {getSecretTypeIcon(data?.secret.type || 'Opaque')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{data?.secret.name}</h2>
                  <p className="text-sm text-slate-500">Secret Resource</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={data?.secret.type || 'Opaque'} />
                <span className="text-xs text-slate-500">
                  Created: {data?.secret.creation_timestamp ?
                    new Date(data.secret.creation_timestamp).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                  <Key className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.secret.data_keys.length || 0}
                </p>
                <p className="text-sm text-slate-500 font-medium">Secret Keys</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                  <Server className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.secret.referenced_by_pods.length || 0}
                </p>
                <p className="text-sm text-slate-500 font-medium">Referenced Pods</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                  <Tag className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {Object.keys(data?.secret.labels || {}).length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Labels</p>
              </div>
            </div>

            {/* Labels Section - Integrated into overview */}
            {data?.secret.labels && Object.keys(data.secret.labels).length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Tag className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Resource Labels</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.secret.labels || {}).map(([key, value]) => (
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

      {/* Secret Data Keys Section */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 p-4 overflow-hidden">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-slate-900">Secret Data</h2>
            {loading.secret ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.secret.data_keys.length || 0} keys
              </span>
            )}
          </div>
        </div>

        {loading.secret ? (
          <div className="p-6">
            <SkeletonLoader rows={3} height="h-16" />
          </div>
        ) : data?.secret.data_keys && data.secret.data_keys.length > 0 ? (
          <div className="p-6 space-y-4">
            {data.secret.data_keys.map((key) => (
              <SecretKeyDisplay
                key={key}
                dataKey={key}
                isExpanded={expandedKeys.has(key)}
                onToggle={() => toggleKeyExpansion(key)}
                secretType={data.secret.type}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Secret Data</p>
            <p className="text-sm">This secret doesn't contain any data keys.</p>
          </div>
        )}
      </div>

      {/* Referenced Pods Table */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden p-4">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Referenced by Pods</h2>
            {loading.pods ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.secret.referenced_by_pods.length || 0}
              </span>
            )}
          </div>
        </div>

        {loading.pods ? (
          <TableSkeletonLoader />
        ) : data?.secret.referenced_by_pods && data.secret.referenced_by_pods.length > 0 ? (
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
                {data.secret.referenced_by_pods.map((pod, index) => (
                  <ReferencedPodRow key={index} pod={pod} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Pod References</p>
            <p className="text-sm">This secret is not currently referenced by any pods.</p>
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
                {data?.secret.events.length || 0}
              </span>
            )}
          </div>
        </div>

        {loading.events ? (
          <TableSkeletonLoader />
        ) : data?.secret.events && data.secret.events.length > 0 ? (
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
                {data.secret.events.map((event, index) => (
                  <EventRow key={index} event={event} source="Secret" />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Events</p>
            <p className="text-sm">No events have been recorded for this secret.</p>
          </div>
        )}
      </div>
    </div>
  );
};
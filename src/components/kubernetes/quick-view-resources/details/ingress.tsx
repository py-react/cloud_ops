import React, { useState } from "react";
import {
  Globe,
  Route,
  Shield,
  Network,
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
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Lock,
  Key,
  ArrowRight,
  MapPin,
  Hash,
  Target,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  SkeletonLoader,
  TableSkeletonLoader,
  MetricSkeletonLoader,
  LoadingSpinner,
} from "./loader";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
      case "active":
      case "ready":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
      case "failed":
      case "error":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm";
      case "warning":
        return "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm";
      case "tls":
      case "https":
        return "bg-green-50 text-green-700 border border-green-200 shadow-sm";
      case "http":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "prefix":
        return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
      case "exact":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm";
      case "implementationspecific":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm";
      case "nginx":
        return "bg-green-50 text-green-700 border border-green-200 shadow-sm";
      case "traefik":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "istio":
        return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
      case "clusterip":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "nodeport":
        return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
      case "loadbalancer":
        return "bg-green-50 text-green-700 border border-green-200 shadow-sm";
      case "tcp":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "udp":
        return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
};

// SIMPLIFIED Routing Rules Component
const RoutingRulesSimple: React.FC<{ rules: any[]; loading: boolean }> = ({
  rules,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-4">
        <SkeletonLoader rows={2} height="h-12" />
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No routing rules configured</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {rules.map((rule, ruleIdx) => (
        <div key={ruleIdx} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-teal-500" />
              <span className="font-medium text-slate-900">{rule.host}</span>
            </div>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-medium">
              {rule.paths.length} path{rule.paths.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {rule.paths.map((path: any, pathIdx: number) => (
              <div
                key={pathIdx}
                className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-slate-700">
                    {path.path}
                  </span>
                  <StatusBadge status={path.path_type} />
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {path.backend.service.name}
                  </span>
                  <span className="text-slate-400">:</span>
                  <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    {path.backend.service.port.number ||
                      path.backend.service.port.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// AI Insights Component for Ingress
const IngressAIInsights: React.FC<{
  loading: boolean;
  ingressName?: string;
  hasRules?: boolean;
  hasTLS?: boolean;
}> = ({ loading, ingressName, hasRules, hasTLS }) => (
  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">Ingress AI Insights</h3>
          <p className="text-sm text-teal-100">
            Traffic routing analysis & security recommendations
          </p>
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
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20"
          >
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
              <Route className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">Routing Health</span>
            </div>
            <p className="text-xs text-teal-100">
              {hasRules
                ? `${ingressName} has active routing rules configured`
                : `${ingressName} uses default backend routing`}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-green-300" />
              <span className="text-sm font-medium">Security Status</span>
            </div>
            <p className="text-xs text-teal-100">
              {hasTLS
                ? "TLS encryption enabled - secure traffic routing"
                : "Consider enabling TLS for secure connections"}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <p className="text-xs text-teal-100">
              Add rate limiting and caching for better performance
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

// Ingress Class Icon
const getIngressClassIcon = (className?: string | null) => {
  if (!className) return <Globe className="h-4 w-4 text-slate-500" />;

  switch (className.toLowerCase()) {
    case "nginx":
      return <Server className="h-4 w-4 text-green-500" />;
    case "traefik":
      return <Route className="h-4 w-4 text-blue-500" />;
    case "istio":
      return <Network className="h-4 w-4 text-purple-500" />;
    case "haproxy":
      return <Shield className="h-4 w-4 text-red-500" />;
    default:
      return <Globe className="h-4 w-4 text-cyan-500" />;
  }
};

// Rule Details Component
const RuleDetails: React.FC<{ rule: any; index: number }> = ({
  rule,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="h-4 w-4 text-teal-500" />
            <div>
              <span className="font-medium text-slate-900">{rule.host}</span>
              <p className="text-xs text-slate-500">
                {rule.paths.length} path{rule.paths.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-md font-medium">
              Rule {index + 1}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="space-y-4">
            {rule.paths.map((path: any, pathIdx: number) => (
              <div
                key={pathIdx}
                className="bg-white rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Route className="h-4 w-4 text-blue-500" />
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {path.path}
                    </span>
                  </div>
                  <StatusBadge status={path.path_type} />
                </div>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span>Routes to:</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {path.backend.service.name}
                  </span>
                  <span className="text-slate-400">:</span>
                  <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                    {path.backend.service.port.number ||
                      path.backend.service.port.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// TLS Configuration Component
const TLSConfiguration: React.FC<{ tlsConfig: any; index: number }> = ({
  tlsConfig,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="h-4 w-4 text-green-500" />
            <div>
              <span className="font-medium text-slate-900">
                {tlsConfig.secret_name}
              </span>
              <p className="text-xs text-slate-500">
                {tlsConfig.hosts.length} host
                {tlsConfig.hosts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status="TLS" />
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="space-y-3">
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Protected Hosts
              </h6>
              <div className="flex flex-wrap gap-2">
                {tlsConfig.hosts.map((host: string, hostIdx: number) => (
                  <span
                    key={hostIdx}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono bg-green-100 text-green-700 border border-green-200"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {host}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Secret Reference
              </h6>
              <div className="bg-slate-100 rounded-lg p-3">
                <span className="text-sm font-mono text-slate-700">
                  {tlsConfig.secret_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Service Row Component
const ServiceRow: React.FC<{ service: any }> = ({ service }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Network className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-slate-900">{service.name}</span>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={service.type} />
        </td>
        <td className="px-6 py-4 text-sm font-mono text-slate-600">
          {service.cluster_ip === "None" ? (
            <span className="text-slate-500 italic">Headless</span>
          ) : (
            service.cluster_ip
          )}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {service.ports.length} port{service.ports.length !== 1 ? "s" : ""}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {service.creation_timestamp
            ? new Date(service.creation_timestamp).toLocaleDateString()
            : "Unknown"}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Service Details
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Namespace:</span>
                    <span className="font-mono text-slate-900">
                      {service.namespace}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-mono text-slate-900">
                      {service.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cluster IP:</span>
                    <span className="font-mono text-slate-900">
                      {service.cluster_ip === "None"
                        ? "Headless"
                        : service.cluster_ip}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Ports
                </h5>
                <div className="space-y-2">
                  {service.ports.map((port: any, portIdx: number) => (
                    <div
                      key={portIdx}
                      className="bg-white rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                          {port.name || `Port ${portIdx + 1}`}
                        </span>
                        <StatusBadge status={port.protocol} />
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-slate-600">
                        <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {port.port}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                          {port.target_port}
                        </span>
                      </div>
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

// Event Type Icon
const getEventTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "normal":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-slate-400" />;
  }
};

// Event Row Component
const EventRow: React.FC<{ event: any; source?: string }> = ({
  event,
  source,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
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
        <td className="px-6 py-4 text-sm text-slate-600">{event.count || 1}</td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {event.lastTimestamp
            ? new Date(event.lastTimestamp).toLocaleString()
            : "Unknown"}
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
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Event Details
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">First Seen:</span>
                    <span className="font-mono text-slate-900">
                      {event.firstTimestamp
                        ? new Date(event.firstTimestamp).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Seen:</span>
                    <span className="font-mono text-slate-900">
                      {event.lastTimestamp
                        ? new Date(event.lastTimestamp).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Count:</span>
                    <span className="font-mono text-slate-900">
                      {event.count || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Component:</span>
                    <span className="font-mono text-slate-900">
                      {event.source?.component ||
                        event.reportingComponent ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Message
                </h5>
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {event.message}
                  </p>
                </div>

                {event.involvedObject && (
                  <div className="mt-4">
                    <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Involved Object
                    </h6>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kind:</span>
                        <span className="font-mono text-slate-900">
                          {event.involvedObject.kind}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-mono text-slate-900">
                          {event.involvedObject.name}
                        </span>
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

export const IngressDetailedInfo = ({ data, loading, error }) => {
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Error Loading Ingress
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={refetch}
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
      <div className="px-6 lg:px-8 py-8">
        {/* AI Insights */}
        <IngressAIInsights
          loading={loading.aiInsights}
          ingressName={data?.ingress.name}
          hasRules={data?.ingress.rules && data.ingress.rules.length > 0}
          hasTLS={data?.ingress.tls && data.ingress.tls.length > 0}
        />

        {/* Ingress Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          {loading.ingress ? (
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
                  <div className="p-3 bg-teal-100 rounded-xl">
                    {getIngressClassIcon(data?.ingress.class_name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {data?.ingress.name}
                    </h2>
                    <p className="text-sm text-slate-500">Ingress Resource</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {data?.ingress.class_name && (
                    <StatusBadge status={data.ingress.class_name} />
                  )}
                  <span className="text-xs text-slate-500">
                    Created:{" "}
                    {data?.ingress.creation_timestamp
                      ? new Date(
                          data.ingress.creation_timestamp
                        ).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-xl mx-auto mb-2">
                    <Route className="h-6 w-6 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.ingress.rules.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    Routing Rules
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-2">
                    <Lock className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.ingress.tls.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    TLS Configs
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                    <Network className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {data?.ingress.target_services.length || 0}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    Target Services
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                    <Tag className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.keys(data?.ingress.labels || {}).length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Labels</p>
                </div>
              </div>

              {/* Labels Section - Integrated into overview */}
              {data?.ingress.labels &&
                Object.keys(data.ingress.labels).length > 0 && (
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Tag className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-slate-700">
                        Ingress Labels
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.ingress.labels).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                          >
                            <span className="text-xs font-mono text-amber-700">
                              {key}
                            </span>
                            <span className="mx-2 text-amber-400">=</span>
                            <span className="text-xs font-mono text-amber-900 font-medium">
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

        {/* Ingress Details Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Info className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Ingress Details
            </h2>
          </div>

          {loading.ingress ? (
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
              {/* Ingress Class */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Ingress Class
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.ingress.class_name || (
                    <span className="text-slate-400">Default</span>
                  )}
                </p>
              </div>

              {/* Load Balancer Status */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Load Balancer
                  </p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.ingress.load_balancer_status.ingress &&
                  data.ingress.load_balancer_status.ingress.length > 0 ? (
                    data.ingress.load_balancer_status.ingress[0].ip
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </p>
              </div>

              {/* Default Backend */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Default Backend
                  </p>
                </div>
                <p className="text-sm font-mono text-slate-900">
                  {data?.ingress.default_backend ? (
                    `${data.ingress.default_backend.service.name}:${
                      data.ingress.default_backend.service.port.number ||
                      data.ingress.default_backend.service.port.name
                    }`
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </p>
              </div>

              {/* TLS Status */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    TLS Status
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {data?.ingress.tls && data.ingress.tls.length > 0 ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Routing Rules Section - SIMPLIFIED */}
        <div className="bg-white rounded-lg border border-slate-200 mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4 text-teal-500" />
              <h2 className="font-semibold text-slate-900">Routing Rules</h2>
              {!loading.rules && (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                  {data?.ingress.rules.length || 0}
                </span>
              )}
            </div>
          </div>

          <RoutingRulesSimple
            rules={data?.ingress.rules || []}
            loading={loading.rules}
          />
        </div>

        {/* TLS Configuration Section */}
        {data?.ingress.tls && data.ingress.tls.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-slate-900">
                  TLS Configuration
                </h2>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data.ingress.tls.length} config
                  {data.ingress.tls.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {data.ingress.tls.map((tlsConfig, index) => (
                <TLSConfiguration
                  key={index}
                  tlsConfig={tlsConfig}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Target Services Table */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Network className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Target Services
              </h2>
              {loading.services ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {data?.ingress.target_services.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.services ? (
            <TableSkeletonLoader />
          ) : data?.ingress.target_services &&
            data.ingress.target_services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Service Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Cluster IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Ports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.ingress.target_services.map((service, index) => (
                    <ServiceRow key={index} service={service} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Target Services</p>
              <p className="text-sm">
                This ingress is not targeting any services.
              </p>
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
                  {data?.ingress.events.length || 0}
                </span>
              )}
            </div>
          </div>

          {loading.events ? (
            <TableSkeletonLoader />
          ) : data?.ingress.events && data.ingress.events.length > 0 ? (
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
                  {data.ingress.events.map((event, index) => (
                    <EventRow key={index} event={event} source="Ingress" />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Events</p>
              <p className="text-sm">
                No events have been recorded for this ingress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

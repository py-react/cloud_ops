import React, { useState } from "react";
import {
  Bot,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Server,
  Network,
  Globe,
  HardDrive,
  FileText,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
  Container,
  Database,
  Key,
  Lock,
  Tag,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { MetricSkeletonLoader, SkeletonLoader, TableSkeletonLoader } from "./loader";

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
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
      case "failed":
      case "error":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm";
      case "bound":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "warning":
        return "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm";
      case "healthy":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status?getStatusColor(
        status
      ):status} ${className}`}
    >
      {status}
    </span>
  );
};

// AI Insights Component
const AIInsights: React.FC = () => (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 mb-8 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Bot className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-sm text-indigo-100">Powered by machine learning</p>
        </div>
      </div>
      <Sparkles className="h-5 w-5 animate-pulse" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-medium">Storage Issue</span>
        </div>
        <p className="text-xs text-indigo-100">
          Pod web-1 pending due to unbound PVC
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-300" />
          <span className="text-sm font-medium">Scaling</span>
        </div>
        <p className="text-xs text-indigo-100">
          Consider horizontal pod autoscaling
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-4 w-4 text-emerald-300" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        <p className="text-xs text-indigo-100">
          Add CPU/memory limits for better scheduling
        </p>
      </div>
    </div>
  </div>
);

// Container Status Icon
const getContainerStatusIcon = (status: string, ready: boolean) => {
  if (status === "Running" && ready) {
    return <Play className="h-4 w-4 text-emerald-500" />;
  } else if (status === "Running" && !ready) {
    return <Pause className="h-4 w-4 text-amber-500" />;
  } else {
    return <RotateCcw className="h-4 w-4 text-slate-400" />;
  }
};

// Pod Row Component
const PodRow: React.FC<{ pod: any }> = ({ pod }) => {
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
            <Server className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-900">{pod.pod_name}</span>
          </button>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={pod.status} />
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">
          {pod.node_name || (
            <span className="text-amber-600">Not assigned</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm font-mono text-slate-600">
          {pod.ip || <span className="text-slate-400">-</span>}
        </td>
        <td className="px-6 py-4 text-sm text-slate-600">{pod.age}</td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">
              {pod.containers.length}
            </span>
            <div className="flex space-x-1">
              {pod.containers.map((container: any, idx: number) => (
                <div
                  key={idx}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      container.status === "Running" && container.ready
                        ? "#10b981"
                        : container.status === "Running"
                        ? "#f59e0b"
                        : "#6b7280",
                  }}
                />
              ))}
            </div>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 py-6 bg-slate-50">
            <div className="space-y-6">
              {/* Containers - Enhanced with detailed view */}
              <div>
                <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-4">
                  <Container className="h-4 w-4 text-indigo-500" />
                  <span>Containers ({pod.containers.length})</span>
                </h4>
                <div className="space-y-4">
                  {pod.containers.map((container: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                    >
                      {/* Container Header */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getContainerStatusIcon(
                              container.status,
                              container.ready
                            )}
                            <div>
                              <h5 className="font-medium text-slate-900">
                                {container.name}
                              </h5>
                              <p className="text-xs text-slate-600 font-mono">
                                {container.image}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={container.status} />
                            {container.restart_count > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium">
                                {container.restart_count} restarts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Container Details */}
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Ports */}
                          <div>
                            <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Ports
                            </h6>
                            <div className="space-y-1">
                              {container.ports.map(
                                (port: any, portIdx: number) => (
                                  <div
                                    key={portIdx}
                                    className="flex items-center space-x-2"
                                  >
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                                      {port.container_port}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {port.protocol}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Resource Requests */}
                          <div>
                            <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Requests
                            </h6>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">CPU:</span>
                                <span className="font-mono text-slate-900">
                                  {container.resources?.requests?.cpu ||
                                    "Not set"}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Memory:</span>
                                <span className="font-mono text-slate-900">
                                  {container.resources?.requests?.memory ||
                                    "Not set"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Resource Limits */}
                          <div>
                            <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Limits
                            </h6>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">CPU:</span>
                                <span className="font-mono text-slate-900">
                                  {container.resources?.limits?.cpu ||
                                    "Not set"}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Memory:</span>
                                <span className="font-mono text-slate-900">
                                  {container.resources?.limits?.memory ||
                                    "Not set"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PVCs */}
              {pod.related_pvcs && pod.related_pvcs.length > 0 && (
                <div>
                  <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-3">
                    <HardDrive className="h-4 w-4 text-purple-500" />
                    <span>Persistent Volume Claims</span>
                  </h4>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Capacity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Access Mode
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pod.related_pvcs.map((pvc: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                {pvc.name}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={pvc.status} />
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {pvc.capacity || "Pending"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {pvc.access_modes.join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ConfigMaps */}
              {pod.related_configmaps && pod.related_configmaps.length > 0 && (
                <div>
                  <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>ConfigMaps</span>
                  </h4>
                  <div className="space-y-3">
                    {pod.related_configmaps.map((cm: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-900">
                            {cm.name}
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                            {Object.keys(cm.data || {}).length} keys
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(cm.data || {})
                            .slice(0, 4)
                            .map((key: string) => (
                              <span
                                key={key}
                                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-mono"
                              >
                                {key}
                              </span>
                            ))}
                          {Object.keys(cm.data || {}).length > 4 && (
                            <span className="text-xs text-slate-500">
                              +{Object.keys(cm.data).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secrets */}
              {pod.related_secrets && pod.related_secrets.length > 0 && (
                <div>
                  <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-3">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span>Secrets</span>
                  </h4>
                  <div className="space-y-3">
                    {pod.related_secrets.map((secret: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-900">
                            {secret.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md">
                              {secret.type}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                              {Object.keys(secret.data || {}).length} keys
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(secret.data || {}).map((key: string) => (
                            <span
                              key={key}
                              className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-mono"
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
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

function DeploymentDetailedInfo({ kubernetesData }) {
  const {
    deployment,
    related_pods,
    related_services,
    related_ingresses,
    related_events,
    namespace,
  } = kubernetesData || {};

  const healthyPods = related_pods?.filter(
    (pod) => pod.status === "Running"
  ).length || 0;
  const totalPods = related_pods?.length || 0;
  const healthPercentage =
    totalPods > 0 ? Math.round((healthyPods / totalPods) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Deployment Overview */}
      {!kubernetesData ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
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

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 rounded"></div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {deployment.deployment_name}
                </h2>
                <p className="text-sm text-slate-500">
                  {deployment.resource_type}
                </p>
              </div>
            </div>
            <StatusBadge
              status={
                deployment.status_color === "yellow" ? "Warning" : "Healthy"
              }
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {deployment.replicas}
              </p>
              <p className="text-sm text-slate-500 font-medium">Desired</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {deployment.available_replicas}
              </p>
              <p className="text-sm text-slate-500 font-medium">Available</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {healthPercentage}%
              </p>
              <p className="text-sm text-slate-500 font-medium">Health</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mx-auto mb-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {totalPods - healthyPods}
              </p>
              <p className="text-sm text-slate-500 font-medium">Issues</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Replica Status</span>
              <span>
                {deployment.available_replicas}/{deployment.replicas} Ready
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    (deployment.available_replicas / deployment.replicas) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Pods Table */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Pods</h2>
            {!kubernetesData ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {related_pods.length}
              </span>
            )}
          </div>
        </div>

        {}

        {!kubernetesData ? (
          <div className="p-6">
            <TableSkeletonLoader />
          </div>
        ) : related_pods && related_pods.length > 0 ? (
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
                    Node
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Containers
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {related_pods.map((pod, index) => (
                  <PodRow key={index} pod={pod} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Pods Found</p>
            <p className="text-sm">
              No pods are currently running in this deployment.
            </p>
          </div>
        )}
      </div>

      {/* Services and Ingress Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Services */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Network className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Services</h2>
              {!kubernetesData ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {related_services.length}
                </span>
              )}
            </div>
          </div>

          {!kubernetesData ? (
            <div className="p-6">
              <SkeletonLoader rows={3} height="h-16" />
            </div>
          ) : related_services && related_services.length > 0 ? (
            <div className="p-6">
              {related_services.map((service, index) => (
                <div
                  key={index}
                  className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">
                      {service.service_name}
                    </h3>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                      {service.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Cluster IP</p>
                      <code className="text-slate-900 font-mono">
                        {service.cluster_ip || "None"}
                      </code>
                    </div>
                    <div>
                      <p className="text-slate-500">Ports</p>
                      <div className="space-y-1">
                        {service.ports.map((port, idx) => (
                          <code
                            key={idx}
                            className="text-slate-900 font-mono block"
                          >
                            {port.port}:{port.target_port}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Services</p>
            </div>
          )}
        </div>

        {/* Ingresses */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Ingresses
              </h2>
              {!kubernetesData ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                  {related_ingresses.length}
                </span>
              )}
            </div>
          </div>

          {!kubernetesData ? (
            <div className="p-6">
              <SkeletonLoader rows={2} height="h-16" />
            </div>
          ) : related_ingresses && related_ingresses.length > 0 ? (
            <div className="p-6">
              {related_ingresses.map((ingress, index) => (
                <div
                  key={index}
                  className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">
                      {ingress.ingress_name}
                    </h3>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-500">Host</p>
                      <code className="text-emerald-700 font-mono">
                        {ingress.host}
                      </code>
                    </div>
                    <div>
                      <p className="text-slate-500">Path</p>
                      <code className="text-slate-900 font-mono">
                        {ingress.path}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Ingresses</p>
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Events
            </h2>
            {!kubernetesData ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {related_events.length}
              </span>
            )}
          </div>
        </div>

        {!kubernetesData ? (
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
        ) : related_events.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {related_events.map((event, index) => (
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
}


export default DeploymentDetailedInfo;

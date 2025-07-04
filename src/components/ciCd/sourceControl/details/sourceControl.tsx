import {
  MetricSkeletonLoader,
  SkeletonLoader,
  TableSkeletonLoader,
} from "@/components/kubernetes/quick-view-resources/details/loader";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  DockIcon,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Plug,
  RefreshCw,
  Terminal,
  User,
  Webhook,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";

function formatUtcToLocal(dateString:string) {
  // dateString is in UTC
  const utcDate = new Date(dateString+ "Z"); // JS auto-parses UTC

  // Get local date equivalent (JS auto adjusts)
  return utcDate.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}


interface BuildLogsViewerProps {
  logs: Array<{
    build_id: number;
    logs: string;
  }>;
  buildStatus: string;
  imageName?: string;
  pullRequestNumber?: string;
  userLogin?: string;
}

export const BuildLogsViewer: React.FC<BuildLogsViewerProps> = ({
  logs,
  buildStatus,
  imageName,
  pullRequestNumber,
  userLogin,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = async () => {
    if (logs.length > 0) {
      try {
        await navigator.clipboard.writeText(logs[0].logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy logs:", err);
      }
    }
  };

  const handleDownloadLogs = () => {
    if (logs.length > 0) {
      const blob = new Blob([logs[0].logs], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `build-${logs[0].build_id}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = () => {
    switch (buildStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Terminal className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = () => {
    switch (buildStatus) {
      case "success":
        return "border-green-200 bg-green-50";
      case "failed":
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-slate-200 bg-slate-50";
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        <Terminal className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-500">No build logs available</p>
      </div>
    );
  }

  const logLines = logs[0].logs
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <div className={`border rounded-lg overflow-hidden ${getStatusColor()}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Build #{logs[0].build_id}
                {pullRequestNumber && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    PR #{pullRequestNumber}
                  </span>
                )}
              </h4>
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                {imageName && <span>Image: {imageName}</span>}
                {userLogin && <span>By: {userLogin}</span>}
                <span>Status: {buildStatus}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLogs}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy logs"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleDownloadLogs}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Content */}
      <div
        className={`bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto ${
          isExpanded ? "max-h-96" : "max-h-48"
        } overflow-y-auto`}
      >
        <div className="p-4">
          {logLines.map((line, idx) => (
            <div
              key={idx}
              className="whitespace-nowrap hover:bg-slate-800 px-2 py-0.5 rounded"
            >
              <span className="text-slate-500 mr-4 select-none">
                {String(idx + 1).padStart(3, " ")}
              </span>
              <span
                className={
                  line.includes("Successfully")
                    ? "text-green-400"
                    : line.includes("Error") || line.includes("FAILED")
                    ? "text-red-400"
                    : line.includes("Step")
                    ? "text-blue-400"
                    : line.includes("---->")
                    ? "text-yellow-400"
                    : "text-slate-300"
                }
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with summary */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="flex justify-between items-center">
          <span>{logLines.length} lines</span>
          <span>Build completed with status: {buildStatus}</span>
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "connected":
      case "active":
      case "success":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      case "started":
      case "pending":
      case "building":
        return "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
      case "failed":
      case "error":
      case "disconnected":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm";
      case "configured":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "warning":
        return "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm";
      case "inactive":
        return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm";
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

// Build Row Component with expandable logs
const BuildRow: React.FC<{ build: any }> = ({ build }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "failed":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
      case "building":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

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
            <div>
              {build.pull_request_number && (
                <p className="text-xs text-slate-500">
                  PR #{build.pull_request_number}
                </p>
              )}
            </div>
          </button>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-sm text-slate-900">
            {build.image_name}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(build.status)}
            <StatusBadge status={build.status} />
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-slate-400" />
            <span className="text-sm text-slate-900">{build.user_login}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-900">
            {build.created_at ? formatUtcToLocal(build.created_at) : "NA"}
          </td>
          <td className="px-6 py-4 text-sm text-slate-900">
            {build.time_taken || "NA"}
          </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="px-6 py-6 bg-slate-50">
            <BuildLogsViewer
              logs={build.logs || []}
              buildStatus={build.status}
              imageName={build.image_name}
              pullRequestNumber={build.pull_request_number}
              userLogin={build.user_login}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export const SourceControlDetailedInfo = ({
  data,
  loading,
  error,
  name,
  branch,
}) => {
  const [copied, setCopied] = useState("");

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "failed":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "started":
      case "building":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const lastBuild = data && data.length ? data[data.length - 1] : undefined;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Error Loading ConfigMap
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
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
                  <Plug className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Repository Overview
                  </h2>
                  <p className="text-sm text-slate-500">
                    Build status and repository information
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">
                  Created:{" "}
                  {data?.creation_timestamp
                    ? new Date(data.creation_timestamp).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-2 gap-6 px-4 pb-6`}>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                  <Webhook className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">Github</p>
                <p className="text-sm text-slate-500 font-medium">Provider</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                  <DockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {lastBuild ? lastBuild?.status : "Unknonw"}
                </p>
                <p className="text-sm text-slate-500 font-medium">Last Build</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Repository Information */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4">
          <div className="px-6 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Webhook className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Repository Information
              </h2>
            </div>
          </div>

          <div className="px-6 pt-6">
            <div className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0">
              <div className="flex flex-col mb-4">
                <p className="text-slate-500 text-sm">Repository URL</p>
                <h3 className="font-semibold text-slate-900 text-base">
                  {name}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-500 mb-2 text-sm">Branch</p>
                  <span className="inline-block text-base bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                    {branch}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 mb-2 text-sm">Provider</p>
                  <span className="space-y-1 text-base">Github</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Last Build Info */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4">
          <div className="px-6 pb-4 border-b flex items-center justify-between border-slate-200">
            <div className="flex items-center space-x-3">
              <DockIcon className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Last Build
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {loading ? (
                <SkeletonLoader className="w-8" />
              ) : (
                <>
                  {getStatusIcon(lastBuild?.status)}
                  <StatusBadge status={lastBuild?.status} />
                </>
              )}
            </div>
          </div>
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={3} height="h-16" />
            </div>
          ) : (
            <div className="px-6 pt-6">
              <div className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-500 mb-2 text-sm">Docker Image</p>
                    <span className="inline-block text-base font-medium">
                      {lastBuild?.image_name}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-500 mb-2 text-sm">Pull Request</p>
                    <span className="inline-block text-base font-medium">
                      #{lastBuild?.pull_request_number}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-2 text-sm">Author</p>
                    <span className="inline-block text-base font-medium">
                      {lastBuild?.user_login}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Build Information  */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 p-4 overflow-hidden">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Builds</h2>
            {loading ? (
              <SkeletonLoader className="w-8" />
            ) : (
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {data?.length}
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-6">
            <TableSkeletonLoader />
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 p-4">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Build
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Image name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Triggered By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Time Taken (seconds)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 p-4">
                {data.map((build, index) => (
                  <BuildRow key={index} build={build} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Builds Found</p>
            <p className="text-sm">
              Builds will appear here once triggered for this repository and
              branch
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

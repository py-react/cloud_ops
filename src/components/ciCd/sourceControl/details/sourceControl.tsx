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
  GitBranch,
} from "lucide-react";
import React, { useState } from "react";
import PageLayout from "@/components/PageLayout";

function formatUtcToLocal(dateString: string) {
  // dateString is in UTC
  const utcDate = new Date(dateString + "Z"); // JS auto-parses UTC

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

  const logLines = logs
    .flatMap((log) => log.logs.split("\n"))
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
        className={`bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto ${isExpanded ? "max-h-96" : "max-h-48"
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
    switch ((status || "").toLowerCase()) {
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
      <tr className="hover:bg-muted/20 transition-colors group">
        <td className="px-6 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <div>
              {build.pull_request_number && (
                <p className="text-[11px] font-bold text-blue-500 transition-all group-hover:pl-0.5">
                  PR #{build.pull_request_number}
                </p>
              )}
            </div>
          </button>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-[13px] font-medium text-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/40">
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
          <div className="flex items-center space-x-1.5">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-[13px] font-medium text-foreground">{build.user_login}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-[13px] font-medium text-muted-foreground">
          {build.created_at ? formatUtcToLocal(build.created_at) : "NA"}
        </td>
        <td className="px-6 py-4 text-[13px] font-bold text-foreground tabular-nums">
          {Number(build.time_taken).toFixed(1)}s
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

interface SourceControlDetailedInfoProps {
  data: any[];
  loading: boolean;
  error: string | null;
  name: string;
  branch: string;
}

export const SourceControlDetailedInfo: React.FC<SourceControlDetailedInfoProps> = ({
  data,
  loading,
  error,
  name,
  branch,
}) => {
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
            Error Loading Data
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
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
    <PageLayout
      title="Repository Overview"
      subtitle={
        <>
          Build status and repository information for <span className="text-primary font-bold">{branch}</span>.
        </>
      }
      icon={GitBranch}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded border border-border/40">
            Created: {data && (data as any).creation_timestamp ? new Date((data as any).creation_timestamp).toLocaleDateString() : "Unknown"}
          </span>
        </div>
      }
    >
      {loading ? (
        <div className="bg-white rounded-xl border border-border/40 p-6 animate-pulse mb-8 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted rounded-lg"></div>
              <div>
                <div className="h-5 w-32 bg-muted rounded mb-2"></div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <MetricSkeletonLoader key={index} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b border-border/30 pb-3">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                  <Webhook className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Repository Info</h2>
              </div>
              <div className="space-y-4 px-1">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Source URL</p>
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Branch</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary ring-1 ring-primary/20">
                      {branch}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Provider</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      GitHub
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10 text-green-500 ring-1 ring-green-500/20">
                    <DockIcon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Last Build</h2>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(lastBuild?.status)}
                  <StatusBadge status={lastBuild?.status} />
                </div>
              </div>
              <div className="space-y-4 px-1">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Artifact Image</p>
                  <p className="text-sm font-mono font-medium text-foreground truncate">{lastBuild?.image_name || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Pull Request</p>
                    <p className="text-sm font-bold text-blue-500">#{lastBuild?.pull_request_number || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Author</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {lastBuild?.user_login || "Internal"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Builds Table */}
      <div className="mt-10">
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border/30 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Build Timeline</h2>
                  <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                    History of triggered builds and deployments
                  </p>
                </div>
              </div>
              {!loading && (
                <span className="text-[11px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded ring-1 ring-indigo-500/20">
                  Total: {data?.length || 0}
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
                <thead className="bg-muted/30">
                  <tr className="border-b border-border/30">
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Build
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Image name
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Triggered By
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
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
    </PageLayout>
  );
};

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DockIcon,
  Tag,
  Hash,
  Settings,
  Rocket,
  FileCog,
  Boxes,
  Network,
} from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

import { ReleaseRun, type ReleaseRunData } from "@/components/ciCd/releaseConfig/forms/releaseConfig";
import { Button } from "@/components/ui/button";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      case "running":
        return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
      case "failed":
      case "error":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm";
    }
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case "failed":
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "pending":
      return <Clock className="h-5 w-5 text-amber-500" />;
    case "running":
      return <Activity className="h-5 w-5 text-blue-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-slate-500" />;
  }
};

const ReleaseConfigDetailedInfo = () => {
  const { config_name, namespace } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runData, setRunData] = useState([] as ReleaseRunData[]);
  const [runDataLoading, setRunDataLoading] = useState(true);
  const [configData, setConfigData] = useState(null);
  const [createRun,setCreateRun] = useState(false)

  const fetchConfigData = () => {
    DefaultService.apiIntegrationKubernetesReleaseGet({
      namespace: namespace,
      name: config_name,
    })
      .then((res) => {
        if (res.status === "success") {
          setConfigData(res.data);
        } else {
          setError(res.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchRunData = () => {
    DefaultService.apiIntegrationKubernetesReleaseRunGet({
      configId: configData.id,
    })
      .then((res) => {
        if (!res.status === "success") {
          toast.error(res.message);
          return;
        } else {
          setRunData(res.data);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setRunDataLoading(false);
      });
  };

  useEffect(() => {
    if (configData?.id) {
      fetchRunData();
    }
  }, [configData]);

  useEffect(() => {
    fetchConfigData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Error Loading Release Config
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4">
      {/* Config Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
        {loading ? (
          <div className="animate-pulse h-24 bg-slate-100 rounded" />
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FileCog className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {configData.deployment_name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Namespace: {configData.namespace}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  Tag: {configData.tag}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {configData.id}
                </p>
                <p className="text-sm text-slate-500 font-medium">Config ID</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                  <Boxes className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {configData.replicas}
                </p>
                <p className="text-sm text-slate-500 font-medium">Replicas</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                  <Rocket className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {runDataLoading ? "unknown" : runData.length}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Release Runs
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                  <DockIcon className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {configData.containers.length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Containers</p>
              </div>
            </div>
            {configData?.labels &&
              Object.keys(configData.labels).length > 0 && (
                <div className="border-t border-slate-100 p-6 pb-0 mt-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">
                      Deployment Labels
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(configData.labels).map(([key, value]) => (
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
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Containers & Service Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Containers */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4">
          <div className="px-6 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <DockIcon className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Containers
              </h2>
            </div>
          </div>
          <div className="px-6 pt-6">
            {configData?.containers?.map((container, idx) => (
              <div
                key={idx}
                className="mb-6 border-b last:border-b-0 pb-4 last:pb-0"
              >
                <div className="font-semibold text-slate-900 mb-2">
                  {container.name}
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Ports:{" "}
                  {container.ports
                    .map((p) => `${p.port}/${p.protocol}`)
                    .join(", ")}
                </div>
                {container.env && (
                  <div className="text-xs text-slate-500 mb-2">
                    Env:{" "}
                    {Object.entries(container.env)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </div>
                )}
                {container.command && (
                  <div className="text-xs text-slate-500 mb-2">
                    Command: {container.command.join(" ")}
                  </div>
                )}
                {container.args && (
                  <div className="text-xs text-slate-500 mb-2">
                    Args: {container.args.join(" ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Service Ports */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4">
          <div className="px-6 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Network className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Service Ports
              </h2>
            </div>
          </div>
          <div className="px-6 pt-6">
            {configData?.service_ports?.length === 0 ? (
              <div className="text-slate-500 text-sm">
                No service ports defined.
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Port</th>
                    <th className="px-2 py-1 text-left">Target Port</th>
                    <th className="px-2 py-1 text-left">Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {configData?.service_ports?.map((port, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">{port.port}</td>
                      <td className="px-2 py-1">{port.target_port}</td>
                      <td className="px-2 py-1">{port.protocol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Labels & Annotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Annotations */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4">
          <div className="px-6 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Annotations
              </h2>
            </div>
          </div>
          <div className="px-6 pt-6">
            {Object.keys(configData?.annotations || {}).length === 0 ? (
              <div className="text-slate-500 text-sm">
                No annotations defined.
              </div>
            ) : (
              <ul className="text-xs">
                {Object.entries(configData?.annotations || {}).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-semibold text-slate-700">{k}:</span>{" "}
                    {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Release Runs Table */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Release Runs
            </h2>
            {runDataLoading ? (
              <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium animate-pulse">
                Loading...
              </span>
            ) : (
              <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
                {runData.length}
              </span>
            )}
          </div>
          <Button
            onClick={() => {
              setCreateRun(true);
            }}
          >
            Create Run
          </Button>
        </div>
        {runDataLoading ? (
          <div className="p-6">
            <div className="h-16 bg-slate-100 rounded mb-2 animate-pulse" />
            <div className="h-16 bg-slate-100 rounded mb-2 animate-pulse" />
          </div>
        ) : runData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 p-4">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Image Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    PR URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Jira
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Created At
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 p-4">
                {runData.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-slate-900">
                      {run.image_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(run.status)}
                        <StatusBadge status={run.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900">
                      {run.pr_url}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {run.jira}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {run.created_at}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Release Runs Found</p>
            <p className="text-sm">
              Release runs will appear here once triggered for this config
            </p>
          </div>
        )}
      </div>
      {configData && configData.id && (
        <ReleaseRun
          onSuccess={() => {
            fetchConfigData();
            setCreateRun(false);
          }}
          deployment_config_id={configData.id}
          open={createRun}
          onClose={(open) => {
            setCreateRun(open);
          }}
        />
      )}
    </div>
  );
};
export default ReleaseConfigDetailedInfo;

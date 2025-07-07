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
  ChevronDown,
  ChevronRight,
  HardDrive,
  Key,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Cpu,
  MemoryStick,
  HeartHandshake,
  Zap,
  Server,
  Globe,
  Container,
  Lock,
  Terminal,
  Image,
} from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

import { ReleaseRun, type ReleaseRunData } from "@/components/ciCd/releaseConfig/forms/releaseRun";
import { Button } from "@/components/ui/button";
import { K8sContainer } from "@/components/ciCd/releaseConfig/forms/type";

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

// Container Details Component for Release Config
const ContainerDetails: React.FC<{ container: K8sContainer }> = ({ container }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Container className="h-4 w-4 text-indigo-500" />
            <div>
              <h5 className="font-medium text-slate-900">{container.name}</h5>
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                {container.imagePullPolicy && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {container.imagePullPolicy}
                  </span>
                )}
                {container.workingDir && (
                  <span className="text-slate-500">
                    Working Dir: {container.workingDir}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              Configured
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
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Ports */}
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <Network className="h-3 w-3 mr-1" />
                Ports
              </h6>
              <div className="space-y-1">
                {container.ports && container.ports.length > 0 ? (
                  container.ports.map((port, portIdx) => (
                    <div key={portIdx} className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                        {port.containerPort}
                      </span>
                      <span className="text-xs text-slate-500">
                        {port.protocol || "TCP"}
                      </span>
                      {port.name && (
                        <span className="text-xs text-slate-400">
                          ({port.name})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    No ports exposed
                  </span>
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
                {container.volumeMounts && container.volumeMounts.length > 0 ? (
                  container.volumeMounts.map((mount, mountIdx) => (
                    <div key={mountIdx} className="text-xs flex gap-2 items-center">
                      <div className="font-mono text-slate-700">
                        {mount.name}
                      </div>
                      <div className="text-slate-500 truncate">
                        {mount.mountPath}
                      </div>
                      {mount.readOnly && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                          RO
                        </span>
                      )}
                      {mount.subPath && (
                        <div className="text-slate-400">
                          SubPath: {mount.subPath}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    No volume mounts
                  </span>
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
                  container.env.map((envVar, envIdx) => (
                    <div key={envIdx} className="text-xs flex gap-2 items-center">
                      <div className="font-mono text-slate-700">
                        {envVar.name}
                      </div>
                      {envVar.value && (
                        <div className="text-slate-500 truncate">
                          = {envVar.value}
                        </div>
                      )}
                      {envVar.valueFrom && (
                        <div className="text-slate-400">
                          {envVar.valueFrom.secretKeyRef &&
                            `Secret: ${envVar.valueFrom.secretKeyRef.name}`}
                          {envVar.valueFrom.configMapKeyRef &&
                            `ConfigMap: ${envVar.valueFrom.configMapKeyRef.name}`}
                          {envVar.valueFrom.fieldRef &&
                            `Field: ${envVar.valueFrom.fieldRef.fieldPath}`}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    No environment variables
                  </span>
                )}
              </div>
            </div>
            <div>
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <Key className="h-3 w-3 mr-1" />
                Environment From
              </h6>
              <div className="space-y-1">
                {container.envFrom && container.envFrom.length > 0 ? (
                  container.envFrom.map((envSource, envIdx) => (
                    <div
                      key={envIdx}
                      className="text-xs font-mono text-slate-700"
                    >
                      {envSource.configMapRef?.name ||
                        envSource.secretRef?.name}{" "}
                      (from source)
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    No environment variables
                  </span>
                )}
                
              </div>
            </div>
          </div>

          {/* Resources Section */}
          {container.resources &&
            Object.keys(container.resources).length > 0 && (
              <div className="mb-6 pt-4 border-t border-slate-200">
                <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                  <Cpu className="h-3 w-3 mr-1" />
                  Resource Allocation
                </h6>
                <div className="grid grid-cols-2 gap-4">
                  {container.resources.requests && (
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Cpu className="h-3 w-3 text-slate-600" />
                        <span className="text-xs font-medium text-slate-800">
                          Requests
                        </span>
                      </div>
                      <div className="space-y-1">
                        {container.resources.requests.cpu && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">CPU:</span>
                            <span className="font-mono text-slate-900">
                              {container.resources.requests.cpu}
                            </span>
                          </div>
                        )}
                        {container.resources.requests.memory && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Memory:</span>
                            <span className="font-mono text-slate-900">
                              {container.resources.requests.memory}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {container.resources.limits && (
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <MemoryStick className="h-3 w-3 text-slate-600" />
                        <span className="text-xs font-medium text-slate-800">
                          Limits
                        </span>
                      </div>
                      <div className="space-y-1">
                        {container.resources.limits.cpu && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">CPU:</span>
                            <span className="font-mono text-slate-900">
                              {container.resources.limits.cpu}
                            </span>
                          </div>
                        )}
                        {container.resources.limits.memory && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Memory:</span>
                            <span className="font-mono text-slate-900">
                              {container.resources.limits.memory}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Health Probes Section */}
          {(container.livenessProbe ||
            container.readinessProbe ||
            container.startupProbe) && (
            <div className="mb-6 pt-4 border-t border-slate-200">
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                <HeartHandshake className="h-3 w-3 mr-1" />
                Health Probes
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {container.livenessProbe && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <HeartHandshake className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-800">
                        Liveness
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      {container.livenessProbe.httpGet && (
                        <div className="text-slate-700">
                          HTTP GET: {container.livenessProbe.httpGet.path}:
                          {container.livenessProbe.httpGet.port}
                        </div>
                      )}
                      {container.livenessProbe.exec && (
                        <div className="text-slate-700">
                          Exec: {container.livenessProbe.exec.command.join(" ")}
                        </div>
                      )}
                      {container.livenessProbe.tcpSocket && (
                        <div className="text-slate-700">
                          TCP Socket: {container.livenessProbe.tcpSocket.port}
                        </div>
                      )}
                      {container.livenessProbe.initialDelaySeconds && (
                        <div className="text-slate-600">
                          Initial: {container.livenessProbe.initialDelaySeconds}
                          s
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {container.readinessProbe && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-800">
                        Readiness
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      {container.readinessProbe.httpGet && (
                        <div className="text-slate-700">
                          HTTP GET: {container.readinessProbe.httpGet.path}:
                          {container.readinessProbe.httpGet.port}
                        </div>
                      )}
                      {container.readinessProbe.exec && (
                        <div className="text-slate-700">
                          Exec:{" "}
                          {container.readinessProbe.exec.command.join(" ")}
                        </div>
                      )}
                      {container.readinessProbe.tcpSocket && (
                        <div className="text-slate-700">
                          TCP Socket: {container.readinessProbe.tcpSocket.port}
                        </div>
                      )}
                      {container.readinessProbe.initialDelaySeconds && (
                        <div className="text-slate-600">
                          Initial:{" "}
                          {container.readinessProbe.initialDelaySeconds}s
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {container.startupProbe && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-800">
                        Startup
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      {container.startupProbe.httpGet && (
                        <div className="text-slate-700">
                          HTTP GET: {container.startupProbe.httpGet.path}:
                          {container.startupProbe.httpGet.port}
                        </div>
                      )}
                      {container.startupProbe.exec && (
                        <div className="text-slate-700">
                          Exec: {container.startupProbe.exec.command.join(" ")}
                        </div>
                      )}
                      {container.startupProbe.tcpSocket && (
                        <div className="text-slate-700">
                          TCP Socket: {container.startupProbe.tcpSocket.port}
                        </div>
                      )}
                      {container.startupProbe.initialDelaySeconds && (
                        <div className="text-slate-600">
                          Initial: {container.startupProbe.initialDelaySeconds}s
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Context Section */}
          {container.securityContext && (
            <div className="mb-6 pt-4 border-t border-slate-200">
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Security Context
              </h6>
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {container.securityContext.runAsUser !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Run as User:</span>
                      <span className="font-mono text-slate-900">
                        {container.securityContext.runAsUser}
                      </span>
                    </div>
                  )}
                  {container.securityContext.runAsNonRoot !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Run as Non-Root:</span>
                      <span className="font-mono text-slate-900">
                        {container.securityContext.runAsNonRoot.toString()}
                      </span>
                    </div>
                  )}
                  {container.securityContext.privileged !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Privileged:</span>
                      <span className="font-mono text-slate-900">
                        {container.securityContext.privileged.toString()}
                      </span>
                    </div>
                  )}
                  {container.securityContext.readOnlyRootFilesystem !==
                    undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Read-Only Root:</span>
                      <span className="font-mono text-slate-900">
                        {container.securityContext.readOnlyRootFilesystem.toString()}
                      </span>
                    </div>
                  )}
                  {container.securityContext.allowPrivilegeEscalation !==
                    undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">
                        Allow Privilege Escalation:
                      </span>
                      <span className="font-mono text-slate-900">
                        {container.securityContext.allowPrivilegeEscalation.toString()}
                      </span>
                    </div>
                  )}
                </div>
                {container.securityContext.capabilities && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      {container.securityContext.capabilities.add &&
                        container.securityContext.capabilities.add.length >
                          0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-700 mb-1">
                              Added Capabilities:
                            </div>
                            <div className="space-y-1">
                              {container.securityContext.capabilities.add.map(
                                (cap, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono"
                                  >
                                    {cap}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {container.securityContext.capabilities.drop &&
                        container.securityContext.capabilities.drop.length >
                          0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-700 mb-1">
                              Dropped Capabilities:
                            </div>
                            <div className="space-y-1">
                              {container.securityContext.capabilities.drop.map(
                                (cap, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono"
                                  >
                                    {cap}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lifecycle Hooks Section */}
          {container.lifecycle && (
            <div className="mb-6 pt-4 border-t border-slate-200">
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Lifecycle Hooks
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {container.lifecycle.postStart && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Play className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-800">
                        Post Start
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {container.lifecycle.postStart.exec && (
                        <div>
                          Exec:{" "}
                          {container.lifecycle.postStart.exec.command.join(" ")}
                        </div>
                      )}
                      {container.lifecycle.postStart.httpGet && (
                        <div>
                          HTTP GET: {container.lifecycle.postStart.httpGet.path}
                          :{container.lifecycle.postStart.httpGet.port}
                        </div>
                      )}
                      {container.lifecycle.postStart.tcpSocket && (
                        <div>
                          TCP Socket:{" "}
                          {container.lifecycle.postStart.tcpSocket.port}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {container.lifecycle.preStop && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Pause className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-800">
                        Pre Stop
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {container.lifecycle.preStop.exec && (
                        <div>
                          Exec:{" "}
                          {container.lifecycle.preStop.exec.command.join(" ")}
                        </div>
                      )}
                      {container.lifecycle.preStop.httpGet && (
                        <div>
                          HTTP GET: {container.lifecycle.preStop.httpGet.path}:
                          {container.lifecycle.preStop.httpGet.port}
                        </div>
                      )}
                      {container.lifecycle.preStop.tcpSocket && (
                        <div>
                          TCP Socket:{" "}
                          {container.lifecycle.preStop.tcpSocket.port}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Command and Args */}
          {(container.command || container.args) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
                <Terminal className="h-3 w-3 mr-1" />
                Execution
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {container.command && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Command</p>
                    <div className="bg-slate-100 rounded px-3 py-2 text-xs font-mono text-slate-900">
                      {Array.isArray(container.command)
                        ? container.command.join(" ")
                        : container.command}
                    </div>
                  </div>
                )}

                {container.args && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Arguments</p>
                    <div className="bg-slate-100 rounded px-3 py-2 text-xs font-mono text-slate-900">
                      {Array.isArray(container.args)
                        ? container.args.join(" ")
                        : container.args}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Container Settings */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h6 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center">
              <Settings className="h-3 w-3 mr-1" />
              Additional Settings
            </h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {container.terminationMessagePath && (
                <div>
                  <span className="text-slate-500">
                    Termination Message Path:
                  </span>
                  <div className="font-mono text-slate-900">
                    {container.terminationMessagePath}
                  </div>
                </div>
              )}
              {container.terminationMessagePolicy && (
                <div>
                  <span className="text-slate-500">
                    Termination Message Policy:
                  </span>
                  <div className="font-mono text-slate-900">
                    {container.terminationMessagePolicy}
                  </div>
                </div>
              )}
              {container.stdin !== undefined && (
                <div>
                  <span className="text-slate-500">STDIN:</span>
                  <div className="font-mono text-slate-900">
                    {container.stdin.toString()}
                  </div>
                </div>
              )}
              {container.tty !== undefined && (
                <div>
                  <span className="text-slate-500">TTY:</span>
                  <div className="font-mono text-slate-900">
                    {container.tty.toString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReleaseConfigDetailedInfo = () => {
  const { config_name, namespace } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runData, setRunData] = useState([] as ReleaseRunData[]);
  const [runDataLoading, setRunDataLoading] = useState(true);
  const [configData, setConfigData] = useState<any>(null);
  const [createRun,setCreateRun] = useState(false)
  
  // Accordion states for affinity sections
  const [nodeAffinityExpanded, setNodeAffinityExpanded] = useState(false);
  const [podAffinityExpanded, setPodAffinityExpanded] = useState(false);
  const [podAntiAffinityExpanded, setPodAntiAffinityExpanded] = useState(false);

  const fetchConfigData = () => {
    DefaultService.apiIntegrationKubernetesReleaseGet({
      namespace: namespace,
      name: config_name,
    })
      .then((res: any) => {
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
      .then((res: any) => {
        if (res.status !== "success") {
          toast.error(res.message);
          return;
        } else {
          setRunData(res.data);
        }
      })
      .catch((err: any) => {
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
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Containers */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4 mb-8">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <DockIcon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Containers
            </h2>
            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
              {configData?.containers?.length || 0}
            </span>
          </div>
        </div>
        <div className="px-6 pt-6">
          {configData?.containers && configData.containers.length > 0 ? (
            <div className="space-y-4">
              {configData.containers.map((container: K8sContainer, idx: number) => (
                <ContainerDetails
                  key={idx}
                  container={container}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <DockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Containers</p>
              <p className="text-sm">No containers are defined for this release config.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pod Affinity & Anti-Affinity */}
      {configData?.affinity && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center space-x-3 px-6 mb-6">
            <Network className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Pod Affinity & Anti-Affinity</h2>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Node Affinity */}
            {configData.affinity.nodeAffinity && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setNodeAffinityExpanded(!nodeAffinityExpanded)}>
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Node Affinity</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Required
                    </span>
                  </div>
                  {nodeAffinityExpanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
                </div>
                
                {nodeAffinityExpanded && (
                  <>
                    {/* Required Node Affinity */}
                    {configData.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution && (
                      <div className="space-y-3">
                    <h4 className="text-sm font-medium text-blue-800">Required During Scheduling</h4>
                    {configData.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.map((term: any, termIdx: number) => (
                      <div key={termIdx} className="bg-white rounded-md border border-blue-200 p-3">
                        <div className="text-xs font-medium text-blue-700 mb-2">Node Selector Term {termIdx + 1}</div>
                        {term.matchExpressions && term.matchExpressions.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-600">Match Expressions:</div>
                            {term.matchExpressions.map((expr: any, exprIdx: number) => (
                              <div key={exprIdx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                                <div className="font-mono text-slate-800">
                                  <span className="font-medium">{expr.key}</span>
                                  <span className="text-blue-600 mx-2">{expr.operator}</span>
                                  {expr.values && expr.values.length > 0 && (
                                    <span className="text-slate-600">[{expr.values.join(', ')}]</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {term.matchFields && term.matchFields.length > 0 && (
                          <div className="space-y-2 mt-2">
                            <div className="text-xs font-medium text-slate-600">Match Fields:</div>
                            {term.matchFields.map((field: any, fieldIdx: number) => (
                              <div key={fieldIdx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                                <div className="font-mono text-slate-800">
                                  <span className="font-medium">{field.key}</span>
                                  <span className="text-blue-600 mx-2">{field.operator}</span>
                                  {field.values && field.values.length > 0 && (
                                    <span className="text-slate-600">[{field.values.join(', ')}]</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preferred Node Affinity */}
                {configData.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-blue-800">Preferred During Scheduling</h4>
                    {configData.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution.map((pref: any, prefIdx: number) => (
                      <div key={prefIdx} className="bg-white rounded-md border border-blue-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-blue-700">Preference {prefIdx + 1}</div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                            Weight: {pref.weight}
                          </span>
                        </div>
                        {pref.preference.matchExpressions && pref.preference.matchExpressions.length > 0 && (
                          <div className="space-y-2">
                            {pref.preference.matchExpressions.map((expr: any, exprIdx: number) => (
                              <div key={exprIdx} className="bg-slate-50 rounded px-3 py-2 text-xs">
                                <div className="font-mono text-slate-800">
                                  <span className="font-medium">{expr.key}</span>
                                  <span className="text-blue-600 mx-2">{expr.operator}</span>
                                  {expr.values && expr.values.length > 0 && (
                                    <span className="text-slate-600">[{expr.values.join(', ')}]</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {/* Pod Affinity */}
            {configData.affinity.podAffinity && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setPodAffinityExpanded(!podAffinityExpanded)}>
                  <div className="flex items-center space-x-2">
                    <DockIcon className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-900">Pod Affinity</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Attract
                    </span>
                  </div>
                  {podAffinityExpanded ? <ChevronDown className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-green-600" />}
                </div>
                
                {podAffinityExpanded && (
                  <>
                
                {/* Required Pod Affinity */}
                {configData.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-green-800">Required During Scheduling</h4>
                    {configData.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution.map((term: any, termIdx: number) => (
                      <div key={termIdx} className="bg-white rounded-md border border-green-200 p-3">
                        <div className="text-xs font-medium text-green-700 mb-2">Pod Affinity Term {termIdx + 1}</div>
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                            <div className="font-medium text-slate-700 mb-1">Topology Key:</div>
                            <div className="font-mono text-slate-900">{term.topologyKey}</div>
                          </div>
                          {term.namespaces && term.namespaces.length > 0 && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Namespaces:</div>
                              <div className="font-mono text-slate-900">{term.namespaces.join(', ')}</div>
                            </div>
                          )}
                          {term.labelSelector && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Label Selector:</div>
                              {term.labelSelector.matchLabels && Object.keys(term.labelSelector.matchLabels).length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-600">Match Labels:</div>
                                  {Object.entries(term.labelSelector.matchLabels).map(([key, value]: [string, any]) => (
                                    <div key={key} className="font-mono text-slate-900">{key}={String(value)}</div>
                                  ))}
                                </div>
                              )}
                              {term.labelSelector.matchExpressions && term.labelSelector.matchExpressions.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-slate-600">Match Expressions:</div>
                                  {term.labelSelector.matchExpressions.map((expr: any, exprIdx: number) => (
                                    <div key={exprIdx} className="font-mono text-slate-900">
                                      {expr.key} {expr.operator} {expr.values ? `[${expr.values.join(', ')}]` : ''}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preferred Pod Affinity */}
                {configData.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-green-800">Preferred During Scheduling</h4>
                    {configData.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution.map((pref: any, prefIdx: number) => (
                      <div key={prefIdx} className="bg-white rounded-md border border-green-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-green-700">Preference {prefIdx + 1}</div>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                            Weight: {pref.weight}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                            <div className="font-medium text-slate-700 mb-1">Topology Key:</div>
                            <div className="font-mono text-slate-900">{pref.podAffinityTerm.topologyKey}</div>
                          </div>
                          {pref.podAffinityTerm.namespaces && pref.podAffinityTerm.namespaces.length > 0 && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Namespaces:</div>
                              <div className="font-mono text-slate-900">{pref.podAffinityTerm.namespaces.join(', ')}</div>
                            </div>
                          )}
                          {pref.podAffinityTerm.labelSelector && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Label Selector:</div>
                              {pref.podAffinityTerm.labelSelector.matchLabels && Object.keys(pref.podAffinityTerm.labelSelector.matchLabels).length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-600">Match Labels:</div>
                                  {Object.entries(pref.podAffinityTerm.labelSelector.matchLabels).map(([key, value]: [string, any]) => (
                                    <div key={key} className="font-mono text-slate-900">{key}={String(value)}</div>
                                  ))}
                                </div>
                              )}
                              {pref.podAffinityTerm.labelSelector.matchExpressions && pref.podAffinityTerm.labelSelector.matchExpressions.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-slate-600">Match Expressions:</div>
                                  {pref.podAffinityTerm.labelSelector.matchExpressions.map((expr: any, exprIdx: number) => (
                                    <div key={exprIdx} className="font-mono text-slate-900">
                                      {expr.key} {expr.operator} {expr.values ? `[${expr.values.join(', ')}]` : ''}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {/* Pod Anti-Affinity */}
            {configData.affinity.podAntiAffinity && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setPodAntiAffinityExpanded(!podAntiAffinityExpanded)}>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <h3 className="font-semibold text-red-900">Pod Anti-Affinity</h3>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Repel
                    </span>
                  </div>
                  {podAntiAffinityExpanded ? <ChevronDown className="h-4 w-4 text-red-600" /> : <ChevronRight className="h-4 w-4 text-red-600" />}
                </div>
                
                {podAntiAffinityExpanded && (
                  <>
                
                {/* Required Pod Anti-Affinity */}
                {configData.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-red-800">Required During Scheduling</h4>
                    {configData.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution.map((term: any, termIdx: number) => (
                      <div key={termIdx} className="bg-white rounded-md border border-red-200 p-3">
                        <div className="text-xs font-medium text-red-700 mb-2">Pod Anti-Affinity Term {termIdx + 1}</div>
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                            <div className="font-medium text-slate-700 mb-1">Topology Key:</div>
                            <div className="font-mono text-slate-900">{term.topologyKey}</div>
                          </div>
                          {term.labelSelector && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Label Selector:</div>
                              {term.labelSelector.matchLabels && Object.keys(term.labelSelector.matchLabels).length > 0 && (
                                <div className="space-y-1">
                                  {Object.entries(term.labelSelector.matchLabels).map(([key, value]: [string, any]) => (
                                    <div key={key} className="font-mono text-slate-900">{key}={String(value)}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preferred Pod Anti-Affinity */}
                {configData.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-red-800">Preferred During Scheduling</h4>
                    {configData.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.map((pref: any, prefIdx: number) => (
                      <div key={prefIdx} className="bg-white rounded-md border border-red-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-red-700">Preference {prefIdx + 1}</div>
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">
                            Weight: {pref.weight}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                            <div className="font-medium text-slate-700 mb-1">Topology Key:</div>
                            <div className="font-mono text-slate-900">{pref.podAffinityTerm.topologyKey}</div>
                          </div>
                          {pref.podAffinityTerm.namespaces && pref.podAffinityTerm.namespaces.length > 0 && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Namespaces:</div>
                              <div className="font-mono text-slate-900">{pref.podAffinityTerm.namespaces.join(', ')}</div>
                            </div>
                          )}
                          {pref.podAffinityTerm.labelSelector && (
                            <div className="bg-slate-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-slate-700 mb-1">Label Selector:</div>
                              {pref.podAffinityTerm.labelSelector.matchLabels && Object.keys(pref.podAffinityTerm.labelSelector.matchLabels).length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-600">Match Labels:</div>
                                  {Object.entries(pref.podAffinityTerm.labelSelector.matchLabels).map(([key, value]: [string, any]) => (
                                    <div key={key} className="font-mono text-slate-900">{key}={String(value)}</div>
                                  ))}
                                </div>
                              )}
                              {pref.podAffinityTerm.labelSelector.matchExpressions && pref.podAffinityTerm.labelSelector.matchExpressions.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-slate-600">Match Expressions:</div>
                                  {pref.podAffinityTerm.labelSelector.matchExpressions.map((expr: any, exprIdx: number) => (
                                    <div key={exprIdx} className="font-mono text-slate-900">
                                      {expr.key} {expr.operator} {expr.values ? `[${expr.values.join(', ')}]` : ''}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tolerations */}
      {configData?.tolerations && configData.tolerations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center space-x-3 px-6 mb-6">
            <Shield className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-slate-900">Tolerations</h2>
            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-medium">
              {configData.tolerations.length}
            </span>
          </div>

          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configData.tolerations.map((toleration: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-800">Toleration {idx + 1}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {toleration.key && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Key:</span>
                        <span className="font-mono text-slate-900">{toleration.key}</span>
                      </div>
                    )}
                    {toleration.operator && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Operator:</span>
                        <span className="font-mono text-slate-900">{toleration.operator}</span>
                      </div>
                    )}
                    {toleration.value && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Value:</span>
                        <span className="font-mono text-slate-900">{toleration.value}</span>
                      </div>
                    )}
                    {toleration.effect && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Effect:</span>
                        <span className="font-mono text-slate-900">{toleration.effect}</span>
                      </div>
                    )}
                    {toleration.tolerationSeconds && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Toleration Seconds:</span>
                        <span className="font-mono text-slate-900">{toleration.tolerationSeconds}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pod Security Context */}
      {configData?.securityContext && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex items-center space-x-3 px-6 mb-6">
            <Shield className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Pod Security Context</h2>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {configData.securityContext.runAsUser !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Run as User:</span>
                    <span className="font-mono text-amber-900">{configData.securityContext.runAsUser}</span>
                  </div>
                )}
                {configData.securityContext.runAsGroup !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Run as Group:</span>
                    <span className="font-mono text-amber-900">{configData.securityContext.runAsGroup}</span>
                  </div>
                )}
                {configData.securityContext.runAsNonRoot !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Run as Non-Root:</span>
                    <span className="font-mono text-amber-900">{configData.securityContext.runAsNonRoot.toString()}</span>
                  </div>
                )}
                {configData.securityContext.fsGroup !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">FS Group:</span>
                    <span className="font-mono text-amber-900">{configData.securityContext.fsGroup}</span>
                  </div>
                )}
                {configData.securityContext.seLinuxOptions && (
                  <div className="col-span-2">
                    <div className="text-amber-700 mb-2">SELinux Options:</div>
                    <div className="bg-white rounded border border-amber-200 p-2 text-xs">
                      {Object.entries(configData.securityContext.seLinuxOptions).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-amber-600">{key}:</span>
                          <span className="font-mono text-amber-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Ports */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4 mb-8">
        <div className="px-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Network className="h-5 w-5 text-blue-500" />
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
            
              <div
                className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">
                    {configData?.deployment_name}-service
                  </h3>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    ClusterIP
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Ports</p>
                    <div className="space-y-1">
                      {configData?.service_ports.map((port: any, idx: number) => (
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
          )}
        </div>
      </div>

      {/* Annotations */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-4 mb-8">
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
                  {String(v)}
                </li>
              ))}
            </ul>
          )}
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

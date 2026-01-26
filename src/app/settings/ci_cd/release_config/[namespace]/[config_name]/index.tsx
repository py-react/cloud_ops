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
  RefreshCw,
  Plug,
} from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

import { ReleaseRun, type ReleaseRunData } from "@/components/ciCd/releaseConfig/forms/releaseRun";
import { Button } from "@/components/ui/button";
import { K8sContainer } from "@/components/ciCd/releaseConfig/forms/type";
import Copier from "@/components/tooltip/copier";

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
    <div className="bg-muted/20 rounded-lg border border-border/40 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-card/40 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Container className="h-4 w-4 text-indigo-500" />
            <div>
              <h5 className="text-sm font-bold text-foreground">{container.name}</h5>
              <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-medium">
                {container.imagePullPolicy && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono border border-border/40">
                    {container.imagePullPolicy}
                  </span>
                )}
                {container.workingDir && (
                  <span className="opacity-70">
                    Dir: {container.workingDir}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
              Active Config
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ports */}
            <div>
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Network className="h-3 w-3" />
                Network Interfaces
              </h6>
              <div className="space-y-1.5">
                {container.ports && container.ports.length > 0 ? (
                  container.ports.map((port, portIdx) => (
                    <div key={portIdx} className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-md border border-border/40">
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {port.containerPort}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">
                        {port.protocol || "TCP"}
                      </span>
                      {port.name && (
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          ({port.name})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No ports exposed</span>
                )}
              </div>
            </div>

            {/* Volume Mounts */}
            <div>
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <HardDrive className="h-3 w-3" />
                Volume Mounts
              </h6>
              <div className="space-y-1.5">
                {container.volumeMounts && container.volumeMounts.length > 0 ? (
                  container.volumeMounts.map((mount, mountIdx) => (
                    <div key={mountIdx} className="bg-muted/30 p-1.5 rounded-md border border-border/40">
                      <div className="text-[11px] font-bold text-foreground mb-0.5">{mount.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate opacity-70">
                        {mount.mountPath}
                      </div>
                      {mount.readOnly && (
                        <span className="mt-1 inline-block text-[9px] font-black bg-amber-500/10 text-amber-500 px-1 rounded ring-1 ring-amber-500/20 uppercase tracking-tighter">
                          Read-Only
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No volumes mounted</span>
                )}
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Key className="h-3 w-3" />
                Environment
              </h6>
              <div className="space-y-1.5">
                {container.env && container.env.length > 0 ? (
                  container.env.map((envVar, envIdx) => (
                    <div key={envIdx} className="bg-muted/30 p-1.5 rounded-md border border-border/40">
                      <div className="text-[11px] font-mono font-bold text-foreground">{envVar.name}</div>
                      {envVar.value && (
                        <div className="text-[10px] text-muted-foreground font-mono truncate opacity-70">
                          {envVar.value}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No env vars defined</span>
                )}
              </div>
            </div>
          </div>

          {/* Resources & Probes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/40">
            {/* Resources Section */}
            <div>
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                Resource Allocation
              </h6>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/40 rounded-lg border border-border/40 p-2.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1.5">Requests</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">CPU</span>
                      <span className="font-mono font-bold text-foreground">{container.resources?.requests?.cpu || "-"}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">MEM</span>
                      <span className="font-mono font-bold text-foreground">{container.resources?.requests?.memory || "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-card/40 rounded-lg border border-border/40 p-2.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1.5">Limits</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">CPU</span>
                      <span className="font-mono font-bold text-foreground">{container.resources?.limits?.cpu || "-"}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">MEM</span>
                      <span className="font-mono font-bold text-foreground">{container.resources?.limits?.memory || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Probes Section */}
            <div>
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <HeartHandshake className="h-3 w-3" />
                Health Probes
              </h6>
              <div className="flex flex-wrap gap-2">
                {container.livenessProbe && (
                  <span className="inline-flex items-center px-1.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                    Liveness Ready
                  </span>
                )}
                {container.readinessProbe && (
                  <span className="inline-flex items-center px-1.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                    Readiness Ready
                  </span>
                )}
                {container.startupProbe && (
                  <span className="inline-flex items-center px-1.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                    Startup Ready
                  </span>
                )}
                {!container.livenessProbe && !container.readinessProbe && !container.startupProbe && (
                  <span className="text-[11px] text-muted-foreground italic">No health probes defined</span>
                )}
              </div>
            </div>
          </div>

          {/* Execution & Command */}
          {(container.command || container.args) && (
            <div className="pt-6 border-t border-border/40">
              <h6 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                Execution Vector
              </h6>
              <div className="space-y-3">
                {container.command && (
                  <div className="bg-black/20 rounded-md p-3 border border-border/40">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Command Override</div>
                    <code className="text-[11px] font-mono text-emerald-400 break-all leading-relaxed">
                      {Array.isArray(container.command) ? container.command.join(" ") : container.command}
                    </code>
                  </div>
                )}
                {container.args && (
                  <div className="bg-black/20 rounded-md p-3 border border-border/40">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Argument Chain</div>
                    <code className="text-[11px] font-mono text-blue-400 break-all leading-relaxed">
                      {Array.isArray(container.args) ? container.args.join(" ") : container.args}
                    </code>
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

const ReleaseConfigDetailedInfo = () => {
  const { config_name, namespace } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runData, setRunData] = useState([] as ReleaseRunData[]);
  const [runDataLoading, setRunDataLoading] = useState(true);
  const [configData, setConfigData] = useState<any>(null);
  const [createRun, setCreateRun] = useState(false)

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
    <div className="w-full h-full flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
      {/* Page Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <FileCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Configuration Details</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                Deployment parameters and environment settings for <span className="text-primary font-bold">{config_name}</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" size="sm" onClick={fetchConfigData}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Sync Config
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setCreateRun(true)}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Run Release
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6 pt-6">
        {/* Config Summary Card */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-48 bg-muted rounded"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted rounded"></div>)}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 border-b border-border/30 pb-3">
                <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                  <Settings className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Config Summary</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Namespace</p>
                  <p className="text-sm font-medium text-foreground">{configData?.namespace}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Repo Binding</p>
                  <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                    <Plug className="w-3.5 h-3.5" />
                    {configData?.code_source_control_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Replicas</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground tabular-nums">{configData?.replicas}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                      Standard
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Service Type</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                    Kubernetes Runtime
                  </span>
                </div>
              </div>

              {configData?.labels && Object.keys(configData.labels).length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Deployment Labels</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(configData.labels || {}).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border/40">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Containers Section */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
              <DockIcon className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Defined Containers</h2>
            <span className="ml-auto bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold border border-border/40">
              {configData?.containers?.length || 0} Unit{configData?.containers?.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {configData?.containers && configData.containers.length > 0 ? (
              configData.containers?.map((container: K8sContainer, idx: number) => (
                <ContainerDetails key={idx} container={container} />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground italic text-sm">No containers defined for this configuration.</div>
            )}
          </div>
        </div>

        {/* Scheduling & Affinity */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                <Network className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Scheduling & Affinity</h2>
            </div>

            <div className="space-y-3">
              {/* Node Affinity */}
              <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm bg-muted/20">
                <button
                  onClick={() => setNodeAffinityExpanded(!nodeAffinityExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Node Affinity</span>
                  </div>
                  {nodeAffinityExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {nodeAffinityExpanded && (
                  <div className="p-4 border-t border-border/40 bg-card/40">
                    {configData?.affinity?.nodeAffinity ? (
                      <pre className="text-[10px] font-mono p-3 bg-black/20 rounded-md overflow-x-auto text-emerald-400">
                        {JSON.stringify(configData.affinity.nodeAffinity, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-2">No node affinity rules defined.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pod Affinity */}
              <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm bg-muted/20">
                <button
                  onClick={() => setPodAffinityExpanded(!podAffinityExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Pod Affinity</span>
                  </div>
                  {podAffinityExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {podAffinityExpanded && (
                  <div className="p-4 border-t border-border/40 bg-card/40">
                    {configData?.affinity?.podAffinity ? (
                      <pre className="text-[10px] font-mono p-3 bg-black/20 rounded-md overflow-x-auto text-blue-400">
                        {JSON.stringify(configData.affinity.podAffinity, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-2">No pod affinity rules defined.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Anti-Affinity */}
              <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm bg-muted/20">
                <button
                  onClick={() => setPodAntiAffinityExpanded(!podAntiAffinityExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Anti-Affinity</span>
                  </div>
                  {podAntiAffinityExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {podAntiAffinityExpanded && (
                  <div className="p-4 border-t border-border/40 bg-card/40">
                    {configData?.affinity?.podAntiAffinity ? (
                      <pre className="text-[10px] font-mono p-3 bg-black/20 rounded-md overflow-x-auto text-amber-400">
                        {JSON.stringify(configData.affinity.podAntiAffinity, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-2">No anti-affinity rules defined.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Annotations */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
            <div className="p-2 rounded-md bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              <Hash className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Annotations</h2>
          </div>

          <div className="px-1">
            {Object.keys(configData?.annotations || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No annotations defined.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(configData?.annotations || {}).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 p-2 rounded-md bg-muted/20 border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{k}</span>
                    <span className="text-[11px] font-mono text-foreground break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Release History Table */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Release History</h2>
              {!runDataLoading && (
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold border border-border/40">
                  {runData.length} RUNS
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {runDataLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}
              </div>
            ) : runData.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="bg-muted/50 border-b border-border/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Image Identifier</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifecycle State</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resources</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {runData.map((run) => (
                    <tr key={run.id} className="group hover:bg-primary/[0.02] transition-colors relative">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-foreground font-mono">{run.image_name}</span>
                          <span className="text-[11px] text-muted-foreground font-medium opacity-70">ID: {run.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <StatusBadge status={run.status} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                            <a href={run.pr_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              PR Link
                            </a>
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                            <Globe className="w-3.5 h-3.5" />
                            {run.jira || 'NO-JIRA'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-bold text-foreground/80">{run.created_at}</span>
                          <span className="text-muted-foreground opacity-60">Initiated By System</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <div className="p-4 rounded-full bg-muted/20 w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-border/30">
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">No execution history found</h3>
                <p className="text-xs text-muted-foreground opacity-60">Trigger a new release to see deployment telemetry here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Padding Bottom */}
        <div className="h-10" />
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

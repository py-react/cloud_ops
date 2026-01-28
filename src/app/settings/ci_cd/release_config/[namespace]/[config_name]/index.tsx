import React, { useContext, useEffect, useState } from "react";
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
  ExternalLink,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

import { ReleaseRun, type ReleaseRunData } from "@/components/ciCd/releaseConfig/forms/releaseRun";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { K8sContainer } from "@/components/ciCd/releaseConfig/forms/type";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable"; // Added
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import PageLayout from "@/components/PageLayout";

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
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />; // Changed to CheckCircle2
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
                CMD/ARGS
              </h6>
              <div className="space-y-3">
                {container.command && (
                  <div className="bg-slate-950/90 rounded-lg p-4 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                    <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-2 px-1">Command Override</div>
                    <code className="text-xs font-mono text-emerald-400 break-all leading-relaxed block bg-black/30 p-2 rounded border border-emerald-500/10">
                      <span className="text-emerald-500/50 mr-2 select-none">$</span>
                      {Array.isArray(container.command) ? container.command.join(" ") : container.command}
                    </code>
                  </div>
                )}
                {container.args && (
                  <div className="bg-slate-950/90 rounded-lg p-4 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                    <div className="text-[10px] font-black text-blue-500/70 uppercase tracking-[0.2em] mb-2 px-1">Argument Chain</div>
                    <code className="text-xs font-mono text-blue-400 break-all leading-relaxed block bg-black/30 p-2 rounded border border-blue-500/10">
                      <span className="text-blue-500/50 mr-2 select-none">#</span>
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
  const [configData, setConfigData] = useState<any>(null);
  const [runData, setRunData] = useState<ReleaseRunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [runDataLoading, setRunDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [rerunValues, setRerunValues] = useState<any>(null);
  const [serviceData, setServiceData] = useState<any>(null);

  const [metadataProfile, setMetadataProfile] = useState<any>(null);
  const [selectorProfile, setSelectorProfile] = useState<any>(null);
  const [dynamicProfiles, setDynamicProfiles] = useState<any[]>([]);

  const toggleRunModal = (open: boolean) => {
    setIsRunModalOpen(open);
    if (!open) setRerunValues(null); // Clear rerun values on close
  };

  const handleRerun = (run: ReleaseRunData) => {
    const values = {
      pr_url: run.pr_url,
      jira: run.jira,
      images: run.images
    };
    setRerunValues(values);
    setIsRunModalOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const historyColumns = [
    {
      header: "Image Identifier",
      accessor: "images",
      cell: (row: ReleaseRunData) => (
        <div className="flex flex-col gap-1">
          {Object.entries(row.images || {}).map(([containerName, imageName]) => (
            <div key={containerName} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 truncate">{containerName}</span>
              <code className="text-[11px] font-mono font-medium text-foreground px-1 bg-muted/30 rounded">{imageName}</code>
            </div>
          ))}
        </div>
      )
    },
    {
      header: "Lifecycle State",
      accessor: "status",
      cell: (row: ReleaseRunData) => (
        <StatusBadge status={row.status || 'unknown'} />
      )
    },
    {
      header: "PR URL",
      accessor: "pr_url",
      cell: (row: ReleaseRunData) => (
        row.pr_url ? (
          <div className="max-w-[150px] truncate" title={row.pr_url}>
            <a href={row.pr_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:underline">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{row.pr_url}</span>
            </a>
          </div>
        ) : <span className="text-[11px] text-muted-foreground italic">N/A</span>
      )
    },
    {
      header: "Jira Ticket",
      accessor: "jira",
      cell: (row: ReleaseRunData) => (
        row.jira ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground max-w-[100px]" title={row.jira}>
            <Hash className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{row.jira}</span>
          </div>
        ) : <span className="text-[11px] text-muted-foreground italic">N/A</span>
      )
    },
    {
      header: "Timeline",
      accessor: "created_at",
      cell: (row: ReleaseRunData) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-foreground">{formatDate(row.created_at)}</span>
        </div>
      )
    },
    {
      header: "Initiated By",
      accessor: "initiated_by",
      cell: (row: ReleaseRunData) => (
        <span className="text-[10px] text-muted-foreground">System</span>
      )
    }
  ];

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
          // setError(res.message); // Removed error state
          toast.error(res.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchRunHistory = () => { // Renamed from fetchRunData
    if (!configData?.id) return;
    setRunDataLoading(true);
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
      fetchRunHistory(); // Call renamed function
    }
  }, [configData]);

  useEffect(() => {
    fetchConfigData();
  }, [namespace, config_name]); // Added config_name to dependencies

  useEffect(() => {
    if (configData?.service_id && namespace) {
      DefaultService.apiIntegrationKubernetesLibraryServiceGet({ namespace })
        .then((res: any) => {
          if (res && Array.isArray(res)) {
            const svc = res.find((s: any) => s.id === configData.service_id);
            if (svc) {
              setServiceData(svc);

              // Fetch Metadata Profile
              if (svc.metadata_profile_id) {
                DefaultService.apiIntegrationKubernetesLibraryServiceMetadataGet({ namespace })
                  .then((metaRes: any) => {
                    if (metaRes && Array.isArray(metaRes)) {
                      const meta = metaRes.find((m: any) => m.id === svc.metadata_profile_id);
                      if (meta) setMetadataProfile(meta);
                    }
                  })
                  .catch(console.error);
              }

              // Fetch Selector Profile
              if (svc.selector_profile_id) {
                DefaultService.apiIntegrationKubernetesLibraryServiceSelectorGet({ namespace })
                  .then((selRes: any) => {
                    if (selRes && Array.isArray(selRes)) {
                      const sel = selRes.find((s: any) => s.id === svc.selector_profile_id);
                      if (sel) setSelectorProfile(sel);
                    }
                  })
                  .catch(console.error);
              }
              // Fetch Dynamic Profiles (ServiceProfiles)
              if (svc.dynamic_attr && Object.keys(svc.dynamic_attr).length > 0) {
                DefaultService.apiIntegrationKubernetesLibraryServiceProfileGet({ namespace })
                  .then((profilesRes: any) => {
                    if (profilesRes && Array.isArray(profilesRes)) {
                      const loadedProfiles: Record<string, any> = {};
                      Object.entries(svc.dynamic_attr).forEach(([key, id]) => {
                        const profile = profilesRes.find((p: any) => p.id === id);
                        if (profile) {
                          loadedProfiles[key] = profile;
                        }
                      });
                      console.log({ loadedProfiles })
                      setDynamicProfiles(Object.values(loadedProfiles)); // Changed to array
                    }
                  })
                  .catch(console.error);
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [configData, namespace]);



  useEffect(() => {
    console.log({ metadataProfile })
  }, [metadataProfile])

  // Removed error handling block as error state is removed.
  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
  //         <h2 className="text-xl font-semibold text-slate-900 mb-2">
  //           Error Loading Release Config
  //         </h2>
  //         <p className="text-slate-600 mb-4">{error}</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <PageLayout
      title="Configuration Details"
      subtitle={
        <>
          Deployment parameters and environment settings for <span className="text-primary font-bold">{config_name}</span>.
        </>
      }
      icon={FileCog}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={fetchConfigData}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button
            variant="gradient"
            onClick={() => toggleRunModal(true)}
            disabled={configData?.status !== "active"}
            title={configData?.status !== "active" ? "Configuration must be 'active' to run a release" : ""}
            className={configData?.status !== "active" ? "opacity-50 cursor-not-allowed grayscale" : ""}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Run Release
          </Button>
        </div>
      }
    >

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
                {configData?.required_source_control && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Repo Binding</p>
                    <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                      <Plug className="w-3.5 h-3.5" />
                      {configData?.code_source_control_name}
                      {configData?.source_control_branch && (
                        <span className="text-muted-foreground font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded ml-1 border border-border/40">
                          {configData.source_control_branch}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Replicas</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground tabular-nums">{configData?.replicas}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Resource Kind</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                    {configData?.kind || 'Deployment'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Service Type</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                    Kubernetes Runtime
                  </span>
                </div>
                {serviceData && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Derived Service</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                      {serviceData.name}
                    </span>
                  </div>
                )}
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

        {/* Derived Service Card */}
        {serviceData && (
          <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                <Network className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Derived Service</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Service Name</p>
                <p className="text-sm font-medium text-foreground">{serviceData.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Metadata Profile</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {metadataProfile ? (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                        {JSON.stringify(metadataProfile.config)}
                      </span>
                    ) : (
                      serviceData.metadata_profile_id && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter bg-muted text-muted-foreground ring-1 ring-border/50">
                          Linked
                        </span>
                      )
                    )}
                  </div>
                  {metadataProfile?.labels && Object.keys(metadataProfile.labels).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(metadataProfile.labels).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1 py-0.5 rounded bg-muted/50 border border-border/30 text-muted-foreground">
                          {k}={String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                  {metadataProfile?.annotations && Object.keys(metadataProfile.annotations).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(metadataProfile.annotations).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1 py-0.5 rounded bg-orange-500/5 border border-orange-500/10 text-orange-600/70">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Selector Profile</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {selectorProfile ? (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                        {JSON.stringify(selectorProfile.selector)}
                      </span>
                    ) : (
                      serviceData.selector_profile_id && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter bg-muted text-muted-foreground ring-1 ring-border/50">
                          Linked
                        </span>
                      )
                    )}
                  </div>
                  {selectorProfile?.labels && Object.keys(selectorProfile.labels).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(selectorProfile.labels).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/5 border border-indigo-500/10 text-indigo-600/70">
                          {k}={String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ports</p>
                {dynamicProfiles.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {dynamicProfiles.map((profile, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        {/* Specific rendering for 'ports' key if profile has ports */}
                        {(profile.type === 'ports') && ( // Assuming 'type' property to identify port profiles
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {profile.config?.map((port: any, pIdx: number) => (
                              <span key={pIdx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/40" title={`${port.name || 'Port'} ${port.port}:${port.targetPort}`}>
                                Ports: {port.port}/{port.protocol || 'TCP'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No dynamic attributes</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Network & Connectivity (Service Ports) */}
        {(configData?.service || (configData?.service_ports && configData.service_ports.length > 0)) && (
          <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                <Globe className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Network & Connectivity</h2>
              {configData?.service?.type && (
                <span className="ml-auto bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                  {configData.service.type}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(configData?.service?.ports || configData?.service_ports || []).map((port: any, idx: number) => (
                <div key={idx} className="bg-muted/20 rounded-lg border border-border/40 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Plug className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-foreground">
                        {port.name || `Port ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {port.port} {port.targetPort ? `→ ${port.targetPort}` : ""}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                    {port.protocol || "TCP"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Containers Section */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
              <DockIcon className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Derived Deployment</h2>
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
        </div>



        {/* Release Stats Card */}
        <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/40 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
            <div className="p-2 rounded-md bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Release Statistics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {(() => {
              // Calculate stats
              const stats = runData.reduce((acc, run) => {
                const status = (run.status || 'unknown').toLowerCase();
                acc.counts[status] = (acc.counts[status] || 0) + 1;
                return acc;
              }, { counts: {} as Record<string, number> });

              const knownStatuses = ['deployed', 'failed', 'pending'];
              const otherStatuses = Object.keys(stats.counts).filter(k => !knownStatuses.includes(k));

              return (
                <>
                  <ResourceCard
                    title="Total Runs"
                    count={runData.length}
                    icon={<Activity className="w-4 h-4" />}
                    color="bg-indigo-500"
                    className="border-indigo-500/20 bg-indigo-500/5 shadow-none hover:border-indigo-500/30 transition-all border"
                    isLoading={runDataLoading}
                  />

                  <ResourceCard
                    title="Deployed"
                    count={stats.counts['deployed'] || 0}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all border"
                    isLoading={runDataLoading}
                  />

                  <ResourceCard
                    title="Failed"
                    count={stats.counts['failed'] || 0}
                    icon={<XCircle className="w-4 h-4" />}
                    color="bg-red-500"
                    className="border-red-500/20 bg-red-500/5 shadow-none hover:border-red-500/30 transition-all border"
                    isLoading={runDataLoading}
                  />

                  <ResourceCard
                    title="Pending"
                    count={stats.counts['pending'] || 0}
                    icon={<Clock className="w-4 h-4" />}
                    color="bg-amber-500"
                    className="border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all border"
                    isLoading={runDataLoading}
                  />

                  {otherStatuses.map(status => (
                    <ResourceCard
                      key={status}
                      title={status}
                      count={stats.counts[status]}
                      icon={<Activity className="w-4 h-4" />}
                      color="bg-slate-500"
                      className="border-slate-500/20 bg-slate-500/5 shadow-none hover:border-slate-500/30 transition-all border"
                      isLoading={runDataLoading}
                    />
                  ))}
                </>
              );
            })()}
          </div>
        </div>

        {/* Release History Table */}
        <div className="mt-8">
          <ResourceTable
            title="Release History"
            description="View and manage past deployment runs."
            icon={<Activity className="h-4 w-4" />}
            columns={historyColumns}
            data={runData}
            loading={runDataLoading}
            extraHeaderContent={
              !runDataLoading && (
                <Badge variant="outline" className="ml-2 font-mono text-[10px]">
                  {runData.length} RUNS
                </Badge>
              )
            }
            customActions={[
              {
                label: "View Deployment",
                icon: ExternalLink,
                onClick: (row) => window.open(`/kubernetes/deployments/${configData?.namespace}/${configData?.deployment_name}`, '_blank'),
              },
              {
                label: "Rerun",
                icon: RotateCcw,
                onClick: (row) => handleRerun(row),
              }
            ]}
          />
        </div>
        <div className="h-10" />
      </div>

      {configData && configData.id && (
        <ReleaseRun
          open={isRunModalOpen}
          onClose={toggleRunModal}
          deployment_config={configData}
          onSuccess={() => {
            fetchRunHistory();
            toggleRunModal(false);
          }}
          defaultValues={rerunValues}
        />
      )}
    </PageLayout>
  );
};

export default ReleaseConfigDetailedInfo;

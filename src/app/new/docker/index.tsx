import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
import { 
  Box, 
  Database, 
  HardDrive, 
  Server, 
  Activity, 
  RefreshCw, 
  Cpu, 
  Shield, 
  Settings, 
  Layers, 
  Globe,
  Plus,
  ArrowRight,
  AlertTriangle,
  FolderOpen,
  ArrowDownToLine,
  FileCode,
  Network as NetworkIcon
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { DefaultService } from "@/gingerJs_api_client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MemroryStatsDetail } from "@/components/docker/systemOverview/MemoryStatsDetail";
import { NetworkStatsDetail } from "@/components/docker/systemOverview/NetworkStatsDetail";
import { LifecycleChart } from "@/components/docker/systemOverview/LifecycleChart";
import { toast } from "sonner";
import useNavigate from "@/libs/navigate";

// Context and Selector components
import { DockerEngineContext } from "@/components/docker/contextProvider/DockerEngineContext";
import { DockerEngineSelector } from "@/components/docker/DockerEngineSelector";

// Dialog components for Form Wizard
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Form Wizards
import { ContainerRunnerForm } from "@/components/docker/containers/forms/ContainerRunnerForm";
import { PackageRunnerForm } from "@/components/docker/packages/forms/PackagePullerForm";
import { PackageCreatorForm } from "@/components/docker/packages/forms/PackageCreatorForm";
import { CreateStorageForm } from "@/components/docker/storages/forms/CreateStorageForm";
import { CreateNetworkForm } from "@/components/docker/network/forms/CreateNetworkForm";

export default function DockerManagementV2() {
  const navigate = useNavigate();
  
  // Consume shared Docker selection context
  const { 
    engines, 
    activeEngineId, 
    activeEngineName, 
    isLoading: isEngineContextLoading 
  } = useContext(DockerEngineContext);

  // Resource stats states
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Modal states for unified creation wizard
  const [showCreatorTypeModal, setShowCreatorTypeModal] = useState(false);
  const [activeCreatorForm, setActiveCreatorForm] = useState<"container" | "pull-image" | "build-image" | "volume" | "network" | null>(null);
  
  // Wizard submission loader states
  const [submittingContainer, setSubmittingContainer] = useState(false);
  const [submittingPull, setSubmittingPull] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchGranularData = async (action: string, stateKey?: string) => {
    const key = stateKey || action;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const response = await DefaultService.apiDockerSystemsPost({
        requestBody: { action }
      }) as any;

      if (!response.error && response.data) {
        setSystemInfo((prev: any) => {
          if (action === "network_io") {
            return {
              ...prev,
              system_stats: {
                ...prev.system_stats,
                network: response.data
              }
            };
          }
          if (action === "memory_usage") {
            return {
              ...prev,
              system_stats: {
                ...prev.system_stats,
                memory: response.data
              }
            };
          }
          return { ...prev, ...response.data };
        });
      } else if (response.error) {
        if (action === "general" || action === "status" || action === "resources") {
          setGlobalError(response.message || "Failed to connect to Docker daemon");
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${action}`, error);
      if (action === "general" || action === "status" || action === "resources") {
        setGlobalError(error.message || "Failed to connect to Docker daemon");
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const refreshAll = useCallback(async () => {
    setIsGlobalRefreshing(true);
    setGlobalError(null);

    const fastActions = [
      "status",
      "general",
      "resources",
      "containers",
      "images",
      "network_config",
      "security",
      "drivers",
      "plugins"
    ];

    const heavyActions = [
      "network_io",
      "memory_usage"
    ];

    const fastPromises = fastActions.map(action => fetchGranularData(action));
    const heavyPromises = heavyActions.map(action => fetchGranularData(action));

    await Promise.all([...fastPromises, ...heavyPromises]);
    setIsGlobalRefreshing(false);
  }, []);

  // Trigger sync on load and whenever active engine ID shifts
  useEffect(() => {
    if (activeEngineId !== null) {
      refreshAll();
    }
  }, [refreshAll, activeEngineId]);

  const isLoading = Object.values(loadingStates).some(state => state) || isEngineContextLoading;

  // Form submission handlers
  const handleCreateContainer = async (data: any) => {
    setSubmittingContainer(true);
    try {
      const response: any = await DefaultService.apiDockerContainersPost({
        requestBody: {
          action: "create",
          create_config: data
        } as any
      });
      if (response.error) {
        toast.error(response.message || "Failed to create container");
      } else {
        toast.success(response.message || "Container created successfully");
        setActiveCreatorForm(null);
        refreshAll();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create container");
    } finally {
      setSubmittingContainer(false);
    }
  };

  const handlePullImage = async (data: any) => {
    setSubmittingPull(true);
    try {
      const response: any = await DefaultService.apiDockerPackagesPost({
        requestBody: {
          action: "pull",
          pull_config: {
            image: data.image,
            registry: data.registry
          }
        }
      });
      if (response.error) {
        toast.error(response.message || "Failed to pull image");
      } else {
        toast.success(response.message || "Image pull initiated");
        setActiveCreatorForm(null);
        refreshAll();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to pull image");
    } finally {
      setSubmittingPull(false);
    }
  };

  const handleBuildImage = async (data: any) => {
    setSubmittingCreate(true);
    try {
      const response: any = await DefaultService.apiDockerPackagesPost({
        requestBody: {
          action: "create",
          create_config: data
        }
      });
      if (response.error) {
        toast.error(response.message || "Failed to build image");
      } else {
        toast.success(response.message || "Image built successfully");
        setActiveCreatorForm(null);
        refreshAll();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to build image");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleCreateStorage = async (data: any) => {
    try {
      const transformedData = {
        name: data.name,
        driver: data.driver,
        driverOpts: data.driver_opts || {},
        labels: data.labels || {}
      };
      const response: any = await DefaultService.apiDockerStoragesPost({
        requestBody: {
          action: "add",
          add_data: transformedData
        }
      });
      toast.success(response?.message || "Storage volume created successfully");
      setActiveCreatorForm(null);
      refreshAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to create storage volume");
    }
  };

  const handleCreateNetwork = async (data: any) => {
    try {
      await DefaultService.apiDockerNetworksPost({
        requestBody: {
          name: data.name,
          driver: data.driver,
          scope: data.scope,
          options: data.options,
          ipam: data.ipam,
          check_duplicate: data.check_duplicate,
          internal: data.internal,
          labels: data.labels,
          enable_ipv6: data.enable_ipv6,
          attachable: data.attachable,
          ingress: data.ingress
        }
      });
      toast.success("Network created successfully");
      setActiveCreatorForm(null);
      refreshAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to create network");
    }
  };

  return (
    <PageLayout
      title="Docker Management"
      subtitle="V2 consolidated control plane for containers, images, volumes, and networking."
      icon={Box}
      actions={
        <div className="flex items-center gap-3">
          {/* Engine Context Switcher */}
          <DockerEngineSelector />

          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isLoading || isGlobalRefreshing}
            className="h-9 gap-2 bg-white shadow-sm border-border/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isGlobalRefreshing) ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowCreatorTypeModal(true)}
            className="h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Resource
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Inline warning banner if active engine is unreachable */}
        {globalError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Active Engine Connection Error:</span> {globalError}
              <p className="text-xs text-muted-foreground mt-0.5">The selected engine context is offline. You can select another configured engine from the switcher dropdown.</p>
            </div>
            <Button size="sm" variant="outline" onClick={refreshAll} className="h-8 bg-white text-destructive border-destructive/20 hover:bg-destructive/5">
              Retry Sync
            </Button>
          </div>
        )}

        {/* --- Quick Links Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="hover:border-primary/50 cursor-pointer transition-all shadow-sm group bg-white/50 backdrop-blur-sm"
            onClick={() => navigate("/new/docker/container")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Box className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground">Containers</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {loadingStates["containers"] ? "Loading..." : `${systemInfo.Containers || 0} active`}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>

          <Card 
            className="hover:border-purple-500/50 cursor-pointer transition-all shadow-sm group bg-white/50 backdrop-blur-sm"
            onClick={() => navigate("/new/docker/packages")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground">Images</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {loadingStates["images"] ? "Loading..." : `${systemInfo.Images || 0} packages`}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>

          <Card 
            className="hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group bg-white/50 backdrop-blur-sm"
            onClick={() => navigate("/new/docker/storages")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground">Storage Volumes</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {loadingStates["volumes"] ? "Loading..." : `${systemInfo.Total || 0} volumes`}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>

          <Card 
            className="hover:border-emerald-500/50 cursor-pointer transition-all shadow-sm group bg-white/50 backdrop-blur-sm"
            onClick={() => navigate("/new/docker/network")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <NetworkIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground">Networks</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Manage virtual networking
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </div>

        {/* --- Resource Performance Matrix --- */}
        {!globalError && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
            <MemroryStatsDetail 
              data={systemInfo.system_stats?.memory} 
              isLoading={loadingStates["memory_usage"]} 
            />
            <NetworkStatsDetail 
              data={systemInfo.system_stats?.network} 
              isLoading={loadingStates["network_io"]} 
            />
            <LifecycleChart 
              data={{
                running: systemInfo.ContainersRunning || 0,
                paused: systemInfo.ContainersPaused || 0,
                stopped: systemInfo.ContainersStopped || 0,
                total: systemInfo.Containers || 0
              }} 
              isLoading={loadingStates["containers"]} 
            />
          </div>
        )}

        {/* --- Detailed Specs Row --- */}
        {!globalError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Daemon Specification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
                  <div className="p-6 border-b md:border-b-0 md:border-r border-border/40 space-y-4 flex flex-col justify-center">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Engine Context</span>
                      <p className="text-xs font-mono font-bold truncate">{activeEngineName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Operating System</span>
                      <p className="text-sm font-bold">{systemInfo.OSType || "N/A"} / {systemInfo.Architecture || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Kernel Version</span>
                      <p className="text-xs font-mono text-muted-foreground">{systemInfo.KernelVersion || "N/A"}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 flex flex-col justify-center">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Compute Resources</span>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black">{systemInfo.NCPU || 0}</span>
                          <span className="text-[9px] uppercase text-muted-foreground">Cores</span>
                        </div>
                        <div className="h-6 w-px bg-border/40" />
                        <div className="flex flex-col">
                          <span className="text-sm font-black">{systemInfo.MemTotal ? (systemInfo.MemTotal / (1024 ** 3)).toFixed(1) : 0} GB</span>
                          <span className="text-[9px] uppercase text-muted-foreground">RAM</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Storage Driver</span>
                      <p className="text-sm font-bold uppercase text-primary">{systemInfo.Driver || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Root Directory</span>
                      <p className="text-[11px] font-mono text-muted-foreground break-all">{systemInfo.DockerRootDir || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  Extended Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[210px]">
                  <div className="divide-y divide-border/40">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-tight">Security Options</span>
                      </div>
                      <div className="flex gap-1">
                        {systemInfo.SecurityOptions?.map((opt: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{opt}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase tracking-tight">Network Plugins</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {systemInfo.Plugins?.Network?.map((p: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-700">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <HardDrive className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase tracking-tight">Volume Plugins</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {systemInfo.Plugins?.Volume?.map((p: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px] border-amber-200 bg-amber-50 text-amber-700">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="px-6 py-4 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase font-black text-muted-foreground">Logging Driver</span>
                    <span className="text-xs font-bold uppercase">{systemInfo.Plugins?.Log?.[0] || "json-file"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* --- Unified Create Resource Step 1: Selection Dialog --- */}
      <Dialog open={showCreatorTypeModal} onOpenChange={setShowCreatorTypeModal}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Create Docker Resource</DialogTitle>
            <DialogDescription className="text-xs">
              Select the type of Docker resource you want to deploy in this environment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card 
              className="hover:border-primary cursor-pointer transition-all shadow-none bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 group"
              onClick={() => {
                setShowCreatorTypeModal(false);
                setActiveCreatorForm("container");
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Box className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">Deploy Container</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Run a container from an image</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-purple-500 cursor-pointer transition-all shadow-none bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-500/5 group"
              onClick={() => {
                setShowCreatorTypeModal(false);
                setActiveCreatorForm("pull-image");
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <ArrowDownToLine className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">Pull Image</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Download image from registry</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-purple-500 cursor-pointer transition-all shadow-none bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-500/5 group"
              onClick={() => {
                setShowCreatorTypeModal(false);
                setActiveCreatorForm("build-image");
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <FileCode className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">Build Image</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Create image using Dockerfile</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-amber-500 cursor-pointer transition-all shadow-none bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-500/5 group"
              onClick={() => {
                setShowCreatorTypeModal(false);
                setActiveCreatorForm("volume");
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">Create Storage</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Provision storage volume</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-emerald-500 cursor-pointer transition-all shadow-none bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-500/5 group col-span-2"
              onClick={() => {
                setShowCreatorTypeModal(false);
                setActiveCreatorForm("network");
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <NetworkIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">Create Network</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Provision virtual network</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Unified Create Resource Step 2: Form Rendering --- */}
      {activeCreatorForm === "container" && (
        <ContainerRunnerForm
          isWizardOpen={true}
          setIsWizardOpen={(open) => {
            if (!open) setActiveCreatorForm(null);
          }}
          onSubmitHandler={handleCreateContainer}
          submitting={submittingContainer}
          setSubmitting={setSubmittingContainer}
        />
      )}

      {activeCreatorForm === "pull-image" && (
        <PackageRunnerForm
          isWizardOpen={true}
          setIsWizardOpen={(open) => {
            if (!open) setActiveCreatorForm(null);
          }}
          onSubmitHandler={handlePullImage}
          submitting={submittingPull}
          setSubmitting={setSubmittingPull}
        />
      )}

      {activeCreatorForm === "build-image" && (
        <PackageCreatorForm
          isWizardOpen={true}
          setIsWizardOpen={(open) => {
            if (!open) setActiveCreatorForm(null);
          }}
          onSubmitHandler={handleBuildImage}
          submitting={submittingCreate}
          setSubmitting={setSubmittingCreate}
        />
      )}

      {activeCreatorForm === "volume" && (
        <CreateStorageForm
          isWizardOpen={true}
          setIsWizardOpen={(open) => {
            if (!open) setActiveCreatorForm(null);
          }}
          onSubmit={handleCreateStorage}
          onCancel={() => setActiveCreatorForm(null)}
        />
      )}

      {activeCreatorForm === "network" && (
        <CreateNetworkForm
          isWizardOpen={true}
          setIsWizardOpen={(open) => {
            if (!open) setActiveCreatorForm(null);
          }}
          onSubmit={handleCreateNetwork}
          onCancel={() => setActiveCreatorForm(null)}
        />
      )}
    </PageLayout>
  );
}

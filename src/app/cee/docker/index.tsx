import React, { useEffect, useState, useCallback } from "react";
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
  Info,
  Clock,
  ArrowUpRight,
  Package
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
import { DockerErrorState } from "@/components/docker/DockerErrorState";
import { toast } from "sonner";
import useNavigate from "@/libs/navigate";

const ContainerListPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fetchGranularData = async (action: string, stateKey?: string) => {
    const key = stateKey || action;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const response = await DefaultService.apiDockerSystemsPost({
        requestBody: { action }
      }) as any;

      if (!response.error && response.data) {
        setSystemInfo(prev => {
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

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const isLoading = Object.values(loadingStates).some(state => state);
  const navigate = useNavigate();

  if (globalError) {
    return <DockerErrorState error={globalError} />;
  }

  return (
    <PageLayout
      title="Docker Engine Management"
      subtitle="Comprehensive control plane for containers, local storage, and daemon configuration."
      icon={Box}
      actions={
        <div className="flex items-center gap-2">
          {systemInfo.ServerVersion && (
            <Badge variant="outline" className="h-9 px-4 font-mono text-xs bg-white shadow-sm border-border/50">
              v{systemInfo.ServerVersion}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAll()}
            disabled={isLoading || isGlobalRefreshing}
            className="h-9 gap-2 bg-white shadow-sm border-border/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isGlobalRefreshing) ? 'animate-spin' : ''}`} />
            Sync Engine
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* --- Hero Metrics Row --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ResourceCard
            title="Containers"
            count={systemInfo.Containers || 0}
            icon={<Box className="w-4 h-4" />}
            color="bg-primary"
            className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-all shadow-none"
            isLoading={loadingStates["containers"]}
          />
          <ResourceCard
            title="Total Images"
            count={systemInfo.Images || 0}
            icon={<Package className="w-4 h-4" />}
            color="bg-purple-500"
            className="border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all shadow-none"
            isLoading={loadingStates["images"]}
          />
          <ResourceCard
            title="Active Volumes"
            count={systemInfo.Total || 0}
            icon={<Database className="w-4 h-4" />}
            color="bg-amber-500"
            className="border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all shadow-none"
            isLoading={loadingStates["volumes"]}
          />
          <ResourceCard
            title="Engine Nodes"
            count={1}
            icon={<Server className="w-4 h-4" />}
            color="bg-emerald-500"
            className="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all shadow-none"
            isLoading={loadingStates["general"]}
          />
        </div>

        {/* --- Resource Performance Matrix --- */}
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

        {/* --- Engine Configuration & Inventory Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detailed Engine Specs */}
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
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Engine Identifier</span>
                    <p className="text-xs font-mono font-bold truncate">{systemInfo.ID || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tight">Operating System</span>
                    <p className="text-sm font-bold">{systemInfo.OSType} / {systemInfo.Architecture}</p>
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

          {/* Capabilities & Plugins */}
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
                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-black uppercase hover:bg-white" onClick={() => navigate('/settings/docker/config')}>
                  Advanced Settings
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContainerListPage;

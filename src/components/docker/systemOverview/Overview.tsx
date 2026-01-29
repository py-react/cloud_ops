import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Activity, Box, Cpu, Database, DatabaseIcon, DockIcon, HardDrive, ImageIcon, Info, Layers, Lock, MemoryStickIcon as Memory, Network, Power, Server, Settings, Shield, Sliders } from 'lucide-react'
import { MemroryStatsDetail } from "./MemoryStatsDetail";
import { ISystemInfo } from "./types";
import { NetworkStatsDetail } from "./NetworkStatsDetail";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageLayout from "@/components/PageLayout";

function replaceDockerWithSystem(text: string) {
  const pattern = /\bdocker\b/gi;
  return text.replace(pattern, (match: string) => {
    if (match === 'docker') {
      return 'system';
    }
    else {
      return 'System';
    }
  });
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10 rounded-xl transition-all duration-200">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export default function SystemInfo({
  systemInfo,
  loadingStates,
  onRefresh,
  isRefreshing
}: {
  systemInfo: ISystemInfo,
  loadingStates?: Record<string, boolean>,
  onRefresh?: () => void,
  isRefreshing?: boolean
}) {
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  return (
    <PageLayout
      title="System Information"
      subtitle="Monitor your system resources, network activity, and container status in real-time."
      icon={DockIcon}
      actions={
        <Button
          variant="outline"
          onClick={onRefresh}
          className="gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 !mt-4">
        <MemroryStatsDetail data={systemInfo.system_stats?.memory} isLoading={loadingStates?.["memory_usage"]} />
        <NetworkStatsDetail data={systemInfo.system_stats?.network} isLoading={loadingStates?.["network_io"]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card className="relative overflow-hidden">
          {loadingStates?.["general"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Info className="w-4 h-4 text-primary" />
              </div>
              General Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-medium">{systemInfo.ID?.slice(0, 8)}...</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{replaceDockerWithSystem(systemInfo.Name || "")}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">OS:</span>
                <span className="font-medium">{systemInfo.OSType}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Kernel:</span>
                <span className="font-medium">{systemInfo.KernelVersion}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Architecture:</span>
                <span className="font-medium">{systemInfo.Architecture}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Docker Version:</span>
                <span className="font-medium">{systemInfo.ServerVersion}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["resources"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Server className="w-4 h-4 text-primary" />
              </div>
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Cpu className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> CPUs:
                </span>
                <span>{systemInfo.NCPU}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Memory className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Memory:
                </span>
                <span>{formatBytes(systemInfo.MemTotal)}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <HardDrive className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Driver:
                </span>
                <span>{systemInfo.Driver}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Memory Limit:
                </span>
                <span>{systemInfo.MemoryLimit ? 'Yes' : 'No'}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Swap Limit:
                </span>
                <span>{systemInfo.SwapLimit ? 'Yes' : 'No'}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["containers"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Box className="w-4 h-4 text-primary" />
              </div>
              Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Box className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Total:
                </span>
                <span>{systemInfo.Containers}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Running:
                </span>
                <span>{systemInfo.ContainersRunning}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Sliders className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Paused:
                </span>
                <span>{systemInfo.ContainersPaused}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Power className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Stopped:
                </span>
                <span>{systemInfo.ContainersStopped}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["images"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              Images and Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Total Images:
                </span>
                <span>{systemInfo.Images}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Database className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Docker Root Dir:
                </span>
                <span>{systemInfo.DockerRootDir}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["network_config"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Network className="w-4 h-4 text-primary" />
              </div>
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">HTTP Proxy:</span>
                <span>{systemInfo.HttpProxy}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">HTTPS Proxy:</span>
                <span>{systemInfo.HttpsProxy}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">No Proxy:</span>
                <span>{systemInfo.NoProxy}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["security"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              {systemInfo.SecurityOptions?.map((option, index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Option {index + 1}:</span>
                    <span>{option}</span>
                  </div>
                  {index < (systemInfo.SecurityOptions?.length || 0) - 1 && <Separator className="my-2" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          {loadingStates?.["drivers"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              {systemInfo.DriverStatus?.map(([key, value], index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{value}</span>
                  </div>
                  {index < (systemInfo.DriverStatus?.length || 0) - 1 && <Separator className="my-2" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2 relative overflow-hidden">
          {loadingStates?.["plugins"] && <LoadingOverlay />}
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              Plugins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center text-sm text-foreground/80">
                    <DatabaseIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Volume
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {systemInfo.Plugins?.Volume?.map((plugin, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="font-normal max-w-[150px] cursor-help">
                            <span className="truncate">{plugin}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{plugin}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {!systemInfo.Plugins?.Volume?.length && <span className="text-muted-foreground text-xs italic">None</span>}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3 flex items-center text-sm text-foreground/80">
                    <Network className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Network
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {systemInfo.Plugins?.Network?.map((plugin, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="font-normal max-w-[150px] cursor-help">
                            <span className="truncate">{plugin}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{plugin}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {!systemInfo.Plugins?.Network?.length && <span className="text-muted-foreground text-xs italic">None</span>}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3 flex items-center text-sm text-foreground/80">
                    <Activity className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Log
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {systemInfo.Plugins?.Log?.map((plugin, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="font-normal max-w-[150px] cursor-help">
                            <span className="truncate">{plugin}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{plugin}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {!systemInfo.Plugins?.Log?.length && <span className="text-muted-foreground text-xs italic">None</span>}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

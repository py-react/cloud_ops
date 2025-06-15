import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Activity, Box, Cpu, Database, DatabaseIcon, HardDrive, ImageIcon, Info, Layers, Lock, MemoryStickIcon as Memory, Network, Power, Server, Settings, Shield, Sliders } from 'lucide-react'
import { MemroryStatsDetail } from "./MemoryStatsDetail";
import { ISystemInfo } from "./types";
import { NetworkStatsDetail } from "./NetworkStatsDetail";

function replaceDockerWithSystem(text) {
    // Define the regex pattern to match 'docker' or 'Docker' as a whole word, case-insensitive
    const pattern = /\bdocker\b/gi;  // Matches 'docker' as a whole word, case-insensitive

    // Replace all occurrences of 'docker' with 'system', and 'Docker' with 'System'.
    return text.replace(pattern, (match, p1) => {
        // If it's 'docker' (lowercase), replace with 'system'
        if (match === 'docker') {
            return 'system';
        }
        // If it's 'Docker' (uppercase), replace with 'System'
        else {
            return 'System';
        }
    });
}



export default function SystemInfo({systemInfo}:{systemInfo:ISystemInfo}) {
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">System Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-6 h-6 mr-2" /> General Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold">ID:</span>
                <span>{systemInfo.ID.slice(0, 8)}...</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">Name:</span>
                <span>{replaceDockerWithSystem(systemInfo.Name)}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">OS:</span>
                <span>{systemInfo.OSType}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">Kernel:</span>
                <span>{systemInfo.KernelVersion}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">Architecture:</span>
                <span>{systemInfo.Architecture}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">Docker Version:</span>
                <span>{systemInfo.ServerVersion}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <MemroryStatsDetail data={systemInfo.system_stats.memory} />
        <NetworkStatsDetail data={systemInfo.system_stats.network} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="w-6 h-6 mr-2" /> Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Cpu className="w-4 h-4 mr-2" /> CPUs:
                </span>
                <span>{systemInfo.NCPU}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Memory className="w-4 h-4 mr-2" /> Memory:
                </span>
                <span>{formatBytes(systemInfo.MemTotal)}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" /> Driver:
                </span>
                <span>{systemInfo.Driver}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Lock className="w-4 h-4 mr-2" /> Memory Limit:
                </span>
                <span>{systemInfo.MemoryLimit ? 'Yes' : 'No'}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Lock className="w-4 h-4 mr-2" /> Swap Limit:
                </span>
                <span>{systemInfo.SwapLimit ? 'Yes' : 'No'}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Box className="w-6 h-6 mr-2" /> Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Box className="w-4 h-4 mr-2" /> Total:
                </span>
                <span>{systemInfo.Containers}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> Running:
                </span>
                <span>{systemInfo.ContainersRunning}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Sliders className="w-4 h-4 mr-2" /> Paused:
                </span>
                <span>{systemInfo.ContainersPaused}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Power className="w-4 h-4 mr-2" /> Stopped:
                </span>
                <span>{systemInfo.ContainersStopped}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="w-6 h-6 mr-2" /> Images and Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" /> Total Images:
                </span>
                <span>{systemInfo.Images}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <Database className="w-4 h-4 mr-2" /> Docker Root Dir:
                </span>
                <span>{systemInfo.DockerRootDir}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="w-6 h-6 mr-2" /> Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold">HTTP Proxy:</span>
                <span>{systemInfo.HttpProxy}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">HTTPS Proxy:</span>
                <span>{systemInfo.HttpsProxy}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-center justify-between">
                <span className="font-semibold">No Proxy:</span>
                <span>{systemInfo.NoProxy}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-6 h-6 mr-2" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              {systemInfo.SecurityOptions.map((option, index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Option {index + 1}:</span>
                    <span>{option}</span>
                  </div>
                  {index < systemInfo.SecurityOptions.length - 1 && <Separator className="my-2" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-6 h-6 mr-2" /> Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 w-full text-sm">
              {systemInfo.DriverStatus?.map(([key, value], index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{key}:</span>
                    <span>{value}</span>
                  </div>
                  {index < systemInfo.DriverStatus.length - 1 && <Separator className="my-2" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="w-6 h-6 mr-2" /> Plugins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <DatabaseIcon className="w-4 h-4 mr-2" /> Volume
                </h3>
                <ul className="space-y-2 w-full text-sm">
                  {systemInfo.Plugins.Volume.map((plugin, index) => (
                    <li key={index}>
                      <div className="flex items-center justify-between">
                        <span>{plugin}</span>
                      </div>
                      {index < systemInfo.Plugins.Volume.length - 1 && <Separator className="my-2" />}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Network className="w-4 h-4 mr-2" /> Network
                </h3>
                <ul className="space-y-2 w-full text-sm">
                  {systemInfo.Plugins.Network.map((plugin, index) => (
                    <li key={index}>
                      <div className="flex items-center justify-between">
                        <span>{plugin}</span>
                      </div>
                      {index < systemInfo.Plugins.Network.length - 1 && <Separator className="my-2" />}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> Log
                </h3>
                <ul className="space-y-2 w-full text-sm">
                  {systemInfo.Plugins.Log.map((plugin, index) => (
                    <li key={index}>
                      <div className="flex items-center justify-between">
                        <span>{plugin}</span>
                      </div>
                      {index < systemInfo.Plugins.Log.length - 1 && <Separator className="my-2" />}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        

      </div>
    </div>
  )
}


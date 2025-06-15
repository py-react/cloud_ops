import React, { useEffect, useState } from "react";
import {
  HardDrive,
  DatabaseIcon,
  FolderOpen,
  ContainerIcon,
  FolderClosed,
  MemoryStick,
  TerminalIcon,
  RefreshCwOff,
  CalendarPlus,
  ChevronsLeftRightEllipsisIcon,
  MoveRightIcon,
  PlayIcon,
  PauseIcon,
  Ban,
  TrashIcon,
  LoaderIcon,
  EditIcon,
  CpuIcon,
} from "lucide-react";
import { parseContainerName } from "src/libs/container-utils";
import type { Container } from "src/types/container";
import { Box, Clock } from "lucide-react";
import { ContainerStatus } from "./common/ContainerStatus";
import { ContainerPorts } from "./common/ContainerPorts";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {FileExplorer} from "@/components/docker/containers/common/file-explorer/FileExplorer"
import { Tabs } from "@/components/ui/tabs";
import { ReactTerminal, TerminalContextProvider } from "react-terminal";
import { toast } from "sonner"
import { ContainerStats } from "./common/ContainerStats";
import { formatBytes } from "@/libs/utils";
import { ApiError, DefaultService, RunContainer } from "@/gingerJs_api_client";


const tabs = [
  { id: "overview", label: "Overview" },
  { id: "logs", label: "Logs" },
  { id: "files", label: "Files" },
  { id: "terminal", label: "Terminal" },
  { id: "stats", label: "Stats" },
];

interface CpuStats {
  cpu_usage: {
    total_usage: number;
  };
  system_cpu_usage: number;
}

interface MemoryStats {
  usage: number;
  limit: number;
}

interface IoStat {
  op: string;
  value: number;
}

interface BlkioStats {
  io_service_bytes_recursive?: IoStat[];
}

interface NetworkStats {
  [key: string]: {
    rx_bytes: number;
    tx_bytes: number;
  };
}

interface ContainerStats {
  cpu_stats: CpuStats;
  precpu_stats: CpuStats;
  memory_stats: MemoryStats;
  blkio_stats: BlkioStats;
  networks: NetworkStats;
}

// Function to calculate CPU usage percentage
function getCpuUsage(cpuStats: CpuStats, previousCpuStats: CpuStats) {
  const totalUsage = cpuStats.cpu_usage.total_usage - previousCpuStats.cpu_usage.total_usage;
  const systemUsage = cpuStats.system_cpu_usage - previousCpuStats.system_cpu_usage;

  // Calculate CPU usage percentage
  const cpuUsagePercent = (totalUsage / systemUsage) * 100;

  return cpuUsagePercent.toFixed(2) + '%';
}

// Function to format memory usage
function getMemoryUsage(memoryStats: MemoryStats) {
  const usage = memoryStats.usage;
  const limit = memoryStats.limit;
  const used = formatBytes(usage);
  const total = formatBytes(limit);
  const percentage = ((usage / limit) * 100).toFixed(1);

  return {
    display: `${used} / ${total}`,
    percentage
  };
}

// Function to show disk I/O stats (Read/Write)
function getDiskIoStats(blkioStats: BlkioStats) {
  let readBytes = 0;
  let writeBytes = 0;

  // Iterate through the io_service_bytes_recursive to calculate total read and write bytes
  blkioStats.io_service_bytes_recursive?.forEach(ioStat => {
    if (ioStat.op === 'read') {
      readBytes += ioStat.value;
    } else if (ioStat.op === 'write') {
      writeBytes += ioStat.value;
    }
  });

  return {
    read: formatBytes(readBytes),
    write: formatBytes(writeBytes)
  };
}

// Function to format network I/O stats (RX and TX bytes)
function getNetworkIoStats(networkStats: NetworkStats) {
  let rxBytes = 0;
  let txBytes = 0;

  for (const interfaceName in networkStats) {
    if (networkStats.hasOwnProperty(interfaceName)) {
      rxBytes += networkStats[interfaceName].rx_bytes;
      txBytes += networkStats[interfaceName].tx_bytes;
    }
  }

  return {
    rx: formatBytes(rxBytes),
    tx: formatBytes(txBytes)
  };
}

// Function to display stats
function displayStats(stats: ContainerStats) {
  const cpuStats = stats.cpu_stats;
  const memoryStats = stats.memory_stats;
  const blkioStats = stats.blkio_stats;
  const networkStats = stats.networks;

  return {
    cpu: getCpuUsage(cpuStats, stats.precpu_stats),
    memory: getMemoryUsage(memoryStats),
    diskIoStats: getDiskIoStats(blkioStats),
    networkIoStats: getNetworkIoStats(networkStats)
  }
}

interface ContainerDetailsProps {
  container: Container;
  onClose: () => void;
  setContainers:React.Dispatch<React.SetStateAction<any[]>>
  showDetails: (container: Container) => void;
  editSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export function ContainerDetails({
  container,
  onClose,
  setContainers,
  showDetails,
  editSelected,
}: ContainerDetailsProps) {
  const [takingAction,setTakingAction] = useState(false)
  const [actionType,setActionType] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState("overview");
  const [logs, setLogs] = useState("");
  const [currentPath, setCurrentPath] = useState("/");
  const { displayName } = parseContainerName(container.name);

  const refreshShowDetailsAfterAction = async(action:string)=>{
    const containersResponse = await fetch("/api/containers",{method:"GET"})
    const containers = (await containersResponse.json()).containers
    setContainers(containers)
    if(action === "remove"){
      showDetails(null)
      return 
    }
    containers.forEach((containerItem:Container) => {
      if(container.id === containerItem.id){
        showDetails(containerItem)
      }
    })
    setTakingAction(false)
  }

  useEffect(() => {
    if (activeTab === "logs") {
      (async () => {
        try {
          const response = await DefaultService.apiContainersPost({
            requestBody:{
              action: "logs",
              containerId: container.id,
            }
          })
          
          setLogs(response.logs);
        } catch (error) {
          if (error instanceof ApiError) {
            return error.body.message
          }
          return error instanceof Error ? error.message : 'Unknown error occurred'
        }
      })();
      return;
    }
    setLogs("");
  }, [activeTab]);

  return (
    <>
      <Dialog
        open={!!container}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-medium">
              <div className="flex justify-between items-start w-full pt-6 pb-4 border-b">
                <div className="space-y-1">
                  <h3
                    className="flex gap-2 items-center text-lg text-gray-900"
                    title={container.name}
                  >
                    {displayName}
                    <ContainerStatus
                      status={container.status}
                      state={container.state}
                    />
                  </h3>
                  <p className="text-sm text-gray-500" title={container.id}>
                    ID: {container.id}
                  </p>
                </div>

                <div className="flex justify-end items-center">
                <div
                      className={`flex gap-2 items-center p-2 max-w-max hover:bg-gray-50 rounded-full ${
                        takingAction ? "pointer-events-none" : "cursor-pointer"
                      }`}
                      onClick={async () => {
                        editSelected(true)
                      }}
                    >
                        <EditIcon className="w-4 h-4" />
                    </div>
                  {!["running"].includes(container.status) && (
                    <div
                      className={`flex gap-2 items-center p-2 max-w-max hover:bg-blue-50 text-blue-600 rounded-full ${
                        takingAction ? "pointer-events-none" : "cursor-pointer"
                      }`}
                      onClick={async () => {
                        setTakingAction(true);
                        setActionType("rerun");
                        const responseObj = await fetch("/api/containers", {
                          headers: {
                            "Content-Type": "application/json",
                          },
                          method: "POST",
                          body: JSON.stringify({
                            action: "rerun",
                            containerId: container.id,
                          }),
                        });
                        const responseData = await responseObj.json();
                        if (responseData.error) {
                          setTakingAction(false);
                          toast.error(responseData.message);
                        } else {
                          toast.success(responseData.message);
                          refreshShowDetailsAfterAction("rerun");
                        }
                      }}
                    >
                      {takingAction && actionType === "rerun" ? (
                        <LoaderIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  {!["exited", "paused","created"].includes(container.status) && (
                    <div
                      className={`flex gap-2 items-center p-2 max-w-max hover:bg-yellow-50 text-yellow-600 rounded-full ${
                        takingAction ? "pointer-events-none" : "cursor-pointer"
                      }`}
                      onClick={async () => {
                        setTakingAction(true);
                        setActionType("pause");
                        const responseObj = await fetch("/api/containers", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            action: "pause",
                            containerId: container.id,
                          }),
                        });
                        const responseData = await responseObj.json();
                        if (responseData.error) {
                          setTakingAction(false);
                          toast.error(responseData.message);
                        } else {
                          toast.success(responseData.message);
                          refreshShowDetailsAfterAction("pause");
                        }
                      }}
                    >
                      {takingAction && actionType === "pause" ? (
                        <LoaderIcon className="w-4 h-4" />
                      ) : (
                        <PauseIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  {!["exited"].includes(container.status) && (
                    <div
                      className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600 rounded-full ${
                        takingAction ? "pointer-events-none" : "cursor-pointer"
                      }`}
                      onClick={async () => {
                        setTakingAction(true);
                        setActionType("stop");
                        const responseObj = await fetch("/api/containers", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            action: "stop",
                            containerId: container.id,
                          }),
                        });
                        const responseData = await responseObj.json();
                        if (responseData.error) {
                          setTakingAction(false);
                          toast.error(responseData.message);
                        } else {
                          toast.success(responseData.message);
                          refreshShowDetailsAfterAction("stop");
                        }
                      }}
                    >
                      {takingAction && actionType === "stop" ? (
                        <LoaderIcon className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  <div
                    className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600  rounded-full ${
                      takingAction ? "pointer-events-none" : "cursor-pointer"
                    }`}
                    onClick={async () => {
                      setTakingAction(true);
                      setActionType("remove");
                      const responseObj = await fetch("/api/containers", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          action: "remove",
                          containerId: container.id,
                        }),
                      });
                      const responseData = await responseObj.json();
                      if (responseData.error) {
                        setTakingAction(false);
                        toast.error(responseData.message);
                      } else {
                        toast.success(responseData.message);
                        refreshShowDetailsAfterAction("remove");
                      }
                    }}
                  >
                    {takingAction && actionType === "remove" ? (
                      <LoaderIcon className="w-4 h-4" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" && (
            <ScrollArea className="h-[380px]">
              <div className="grid grid-cols-2 gap-6 my-4">
                <div className="">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ContainerIcon className="w-3.5 h-3.5" />
                    <span>Image</span>
                  </div>
                  <div className="my-1 px-2 text-sm text-gray-500 break-words overflow-x-auto">
                    {container.image}
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Created At</span>
                  </div>
                  <div className="my-1 px-2 text-sm text-gray-500 ">
                    {formatDistanceToNow(new Date(container.created), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {container.state.Running ? "Running Since" : "Last Ran"}
                    </span>
                  </div>
                  <div className="my-1 px-2 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(container.state.StartedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCwOff className="w-3.5 h-3.5" />
                    <span>Last Stoped</span>
                  </div>
                  <div className="my-1 px-2 text-sm text-gray-500">
                    {/* check if FinishedAt is before createdAt, this will indicate that this conatiner is never stoped */}
                    {formatDistanceToNow(new Date(container.state.FinishedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <ContainerPorts ports={Object.keys(container.ports||{}).length?container.ports:container.host_config.PortBindings} testSize="text-sm" />
                {container.host_config.CpuShares ? (
                  <div className="">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CpuIcon className="w-3.5 h-3.5" />
                      <span>CPUs</span>
                    </div>
                    <div className="my-1 px-2 text-sm text-gray-500">
                      {container.host_config.CpuShares ? `${(container.host_config.CpuShares / Math.pow(1024, Math.floor(Math.log(container.host_config.CpuShares) / Math.log(1024)))).toFixed(0)}` : "N/A"}
                    </div>
                  </div>
                ) : null}
                {container.host_config.Memory ? (
                  <div className="">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MemoryStick className="w-3.5 h-3.5" />
                      <span>Memory</span>
                    </div>
                    <div className="my-1 px-2 text-sm text-gray-500">
                      {container.host_config.Memory ? formatBytes(container.host_config.Memory) : "N/A"}
                    </div>
                  </div>
                ) : null}
                {container.host_config.MemoryReservation ? (
                  <div className="">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MemoryStick className="w-3.5 h-3.5" />
                      <span>Memory Reservation</span>
                    </div>
                    <div className="my-1 px-2 text-sm text-gray-500">
                      {container.host_config.MemoryReservation ? formatBytes(container.host_config.MemoryReservation) : "N/A"}
                    </div>
                  </div>
                ) : null}
                {container.host_config.MemorySwap ? (
                  <div className="">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MemoryStick className="w-3.5 h-3.5" />
                      <span>Memory Swap</span>
                    </div>
                    <div className="my-1 px-2 text-sm text-gray-500">
                      {container.host_config.MemorySwap ? formatBytes(container.host_config.MemorySwap) : "N/A"}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-6 my-4">
                
              </div>
              <div className="my-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Command</span>
                </div>
                <div className="my-1 px-2">
                  <div className="text-sm text-gray-500 break-words">
                    {container.command?.join(" ") || "No command found"}
                  </div>
                </div>
              </div>
              <div className="my-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Box className="w-3.5 h-3.5" />
                  <span>Environment</span>
                </div>
                <div className="my-1 px-2">
                  {container.env_vars?.map((item, index) => {
                    return (
                      <div key={index} className="text-sm text-gray-500">
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="my-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Mounts</span>
                </div>
                <div className="my-1 px-2">
                  {container.volumes.map((item, index) => {
                    const Destination = item.Destination;
                    const Source = item.Source;
                    const Mode = item.Mode;
                    const Type = item.Type;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 text-sm text-gray-500 mb-2"
                      >
                        <div className="flex items-start w-[40%] gap-2">
                          <span className="w-full break-words">{Source}</span>
                        </div>
                        <div className="flex items-center flex-col w-[20%]">
                          <span>
                            {Mode === "ro"
                              ? "(Read-only)"
                              : Mode === "rw"
                              ? "(Read/Write)"
                              : Mode}
                          </span>
                          <div className="flex items-center gap-2">
                            <div>
                              {Type === "volume" && (
                                <DatabaseIcon className="w-4 h-4" />
                              )}
                              {Type === "bind" && (
                                <React.Fragment>
                                  {Mode === "rw" && (
                                    <FolderOpen className="w-4 h-4" />
                                  )}
                                  {Mode === "ro" && (
                                    <FolderClosed className="w-4 h-4" />
                                  )}
                                </React.Fragment>
                              )}
                              {Type === "tmpfs" && (
                                <MemoryStick className="w-4 h-4" />
                              )}
                            </div>
                            {Mode === "rw" && (
                              <ChevronsLeftRightEllipsisIcon className="w-4 h-4" />
                            )}
                            {Mode === "ro" && (
                              <MoveRightIcon className="w-4 h-4" />
                            )}
                            <ContainerIcon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center w-[40%]">
                          <span className="w-full">{Destination}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
          {activeTab === "logs" && (
            <ScrollArea className="h-[380px] bg-gray-900 text-white p-4 rounded-lg">
              {["running","exited","paused"].includes(container.status) ? (
                <div className="text-sm ">
                  {logs?.split("\n").map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>
              ) : (
                `Container is not running`
              )}
            </ScrollArea>
          )}
          {activeTab === "files" && (
            <>
              {["running"].includes(container.status) ? (
                <div className="w-full h-[460px] overflow-y-auto rounded-lg">
                  <FileExplorer
                    containerId={container.id}
                    currentPath={currentPath}
                    attachTerminalToPath={(
                      action: "attach" | "set",
                      path?: string
                    ) => {
                      if (path) {
                        setCurrentPath(path);
                      }
                      if (action == "attach") {
                        setActiveTab("terminal");
                        return;
                      }
                    }}
                  />
                </div>
              ) : (
                `Container is not running`
              )}
            </>
          )}
          {activeTab === "terminal" && (
            <ScrollArea
              className={`h-[380px] ${
                ["running"].includes(container.status) ? "bg-[#272B36]" : ""
              }`}
            >
              {["running"].includes(container.status) ? (
                <TerminalContextProvider>
                  <ReactTerminal
                    defaultHandler={async (...cmd: string[]) => {
                      try {
                        console.log({cmd})
                        const response = await DefaultService.apiContainersPost({
                          requestBody:{
                            action: "command" as RunContainer["action"],
                            containerId: container.id,
                            dir: {
                              directory: currentPath,
                              command: cmd.join(" "),
                            },
                          }
                        })
                        return response.output;
                      } catch (error) {
                        if (error instanceof ApiError) {
                          return error.body.message
                        }
                        return error instanceof Error ? error.message : 'Unknown error occurred'
                      }
                    }}
                    showControlBar={false}
                    showControlButtons={false}
                    themes={{
                      "my-custom-theme": {
                        themeBGColor: "#272B36",
                        themeToolbarColor: "#DBDBDB",
                        themeColor: "#FFFEFC",
                        // themePromptColor: "#a917a8",
                      },
                    }}
                    theme="my-custom-theme"
                  />
                </TerminalContextProvider>
              ) : (
                `Container is not running`
              )}
            </ScrollArea>
          )}
          {activeTab === "stats" && (
            <div className="p-4">
              <ContainerStats containerId={container.id} />
            </div>
          )}

          {/* <pre>{JSON.stringify(container, null, 4)}</pre> */}
        </DialogContent>
      </Dialog>
    </>
  );
}

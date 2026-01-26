import React, { useState } from "react";
import {
  ContainerIcon,
  PlayIcon,
  PauseIcon,
  Ban,
  TrashIcon,
  LoaderIcon,
  EditIcon,
  Info,
  FileText,
  Folder,
  Terminal as TerminalIcon,
  Activity,
} from "lucide-react";
import { parseContainerName } from "src/libs/container-utils";
import type { Container } from "src/types/container";
import { toast } from "sonner";
import Wizard from "@/components/wizard/wizard";
import Overview from "./sections/overview";
import Logs from "./sections/logs";
import Files from "./sections/files";
import Terminal from "./sections/terminal";
import Stats from "./sections/stats";
import { DefaultService } from "@/gingerJs_api_client";

interface ContainerDetailsProps {
  container: Container;
  onClose: () => void;
  setContainers: React.Dispatch<React.SetStateAction<any[]>>;
  showDetails: (container: Container) => void;
  editSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ContainerDetails({
  container,
  onClose,
  setContainers,
  showDetails,
  editSelected,
}: ContainerDetailsProps) {
  const [takingAction, setTakingAction] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { displayName } = parseContainerName(container.name);
  const [currentPath, setCurrentPath] = useState("/");

  const steps = [
    {
      id: "overview",
      label: "Overview",
      icon: Info,
      description: "General container info",
      longDescription:
        "View essential details such as container ID, image name, status, creation time, restart policy, and exposed ports.",
      props: { container },
      component: Overview,
    },
    {
      id: "logs",
      label: "Logs",
      icon: FileText,
      description: "Output and error stream",
      longDescription:
        "Access and monitor standard output (stdout) and standard error (stderr) from your container. Supports log tailing and timestamps.",
      props: { container },
      component: Logs,
    },
    {
      id: "files",
      label: "Files",
      icon: Folder,
      description: "Filesystem navigator",
      longDescription:
        "Inspect the container's file structure, including config files, logs, and temporary data. Verify mounted volumes and bind mounts.",
      props: { container, setActiveTab, setCurrentPath, currentPath },
      component: Files,
    },
    {
      id: "terminal",
      label: "Terminal",
      icon: TerminalIcon,
      description: "Interactive shell access",
      longDescription:
        "Open an interactive shell (bash or sh) inside the running container for real-time debugging and command execution.",
      props: { container, currentPath },
      component: Terminal,
    },
    {
      id: "stats",
      label: "Stats",
      icon: Activity,
      description: "Performance monitoring",
      longDescription:
        "View real-time resource usage statistics including CPU, memory, network, and disk I/O for performance tuning.",
      props: { container },
      component: Stats,
    },
  ];

  const refreshShowDetailsAfterAction = async (action: string) => {

    const containersResponse = await DefaultService.apiDockerContainersGet().catch((err: any) => toast.error(err.message))

    const containers = (containersResponse as any).containers || [];
    setContainers(containers);
    if (action === "remove") {
      showDetails(null as any);
      return;
    }
    containers.forEach((containerItem: Container) => {
      if (container.id === containerItem.id) {
        showDetails(containerItem);
      }
    });
    setTakingAction(false);
  };



  return (
    <Wizard
      variant="dialog"
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      isWizardOpen={!!container}
      steps={steps}
      setIsWizardOpen={(isOpen) => (!isOpen ? onClose() : {})}
      heading={{
        primary: displayName,
        secondary: `ID: ${container.id}`,
        icon: ContainerIcon,
        actions: (
          <>
            <button
              className={`flex gap-2 items-center p-2 max-w-max hover:bg-gray-50 rounded-full ${takingAction ? "pointer-events-none" : "cursor-pointer"
                }`}
              onClick={async () => {
                editSelected(true);
              }}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            {!["running"].includes(container.status) && (
              <button
                className={`flex gap-2 items-center p-2 max-w-max hover:bg-blue-50 text-blue-600 rounded-full ${takingAction ? "pointer-events-none" : "cursor-pointer"
                  }`}
                onClick={async () => {
                  setTakingAction(true);
                  setActionType("rerun");
                  DefaultService.apiDockerContainersPost({
                    requestBody: {
                      action: "rerun",
                      containerId: container.id
                    }
                  }).then((responseData: any) => {
                    if (responseData.error) {
                      setTakingAction(false);
                      toast.error(responseData.message);
                    } else {
                      toast.success(responseData.message);
                      refreshShowDetailsAfterAction("rerun");
                    }
                  }).catch((err: any) => {
                    toast.error(err.message)
                  })
                }}
              >
                {takingAction && actionType === "rerun" ? (
                  <LoaderIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
              </button>
            )}
            {!["exited", "paused", "created"].includes(container.status) && (
              <button
                className={`flex gap-2 items-center p-2 max-w-max hover:bg-yellow-50 text-yellow-600 rounded-full ${takingAction ? "pointer-events-none" : "cursor-pointer"
                  }`}
                onClick={async () => {
                  setTakingAction(true);
                  setActionType("pause");
                  const responseData =
                    await DefaultService.apiDockerContainersPost({
                      requestBody: {
                        action: "pause",
                        containerId: container.id,
                      },
                    }).catch((err: any) => {
                      toast.error(err.message);
                    }) as any;
                  if (responseData && responseData.error) {
                    setTakingAction(false);
                    toast.error(responseData.message);
                  } else if (responseData) {
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
              </button>
            )}
            {!["exited"].includes(container.status) && (
              <button
                className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600 rounded-full ${takingAction ? "pointer-events-none" : "cursor-pointer"
                  }`}
                onClick={async () => {
                  setTakingAction(true);
                  setActionType("stop");
                  const responseData =
                    await DefaultService.apiDockerContainersPost({
                      requestBody: {
                        action: "stop",
                        containerId: container.id,
                      },
                    }).catch((err: any) => {
                      toast.error(err.message);
                    }) as any;
                  if (responseData && responseData.error) {
                    setTakingAction(false);
                    toast.error(responseData.message);
                  } else if (responseData) {
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
              </button>
            )}
            <button
              className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600  rounded-full ${takingAction ? "pointer-events-none" : "cursor-pointer"
                }`}
              onClick={async () => {
                setTakingAction(true);
                setActionType("remove");
                const responseData =
                  await DefaultService.apiDockerContainersPost({
                    requestBody: {
                      action: "remove",
                      containerId: container.id,
                    },
                  }).catch((err: any) => {
                    toast.error(err.message);
                  }) as any;
                if (responseData && responseData.error) {
                  setTakingAction(false);
                  toast.error(responseData.message);
                } else if (responseData) {
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
            </button>
          </>
        ),
      }}
    />
  );
}

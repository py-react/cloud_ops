import React, { useState } from "react";
import { Box, Clock, ContainerIcon, Ban, PauseIcon, PlayIcon, TrashIcon,LoaderIcon, EyeIcon, EditIcon } from "lucide-react";
import { ContainerStatus } from "./ContainerStatus";
import { ContainerPorts } from "./ContainerPorts";
import { formatDistanceToNow } from "date-fns";
import { parseContainerName } from "src/libs/container-utils";
import { toast } from "sonner"
import { ContainerInfo } from "@/gingerJs_api_client";
import { ScrollArea } from "@/components/ui/scroll-area";


interface ContainerCardProps {
  container: ContainerInfo;
  showDetails: (container: ContainerInfo) => void;
  setContainers:React.Dispatch<React.SetStateAction<ContainerInfo[]>>
  editSelected: React.Dispatch<React.SetStateAction<boolean>>

}

export function ContainerCard({ container, showDetails,setContainers ,editSelected}: ContainerCardProps) {
  const [takingAction,setTakingAction] = useState(false)
  const [actionType,setActionType] = useState<string|null>(null)
  const { displayName } = parseContainerName(container.name);

  const openShowDetailsAfterAction = async()=>{
    const containersResponse = await fetch("/api/containers",{method:"GET"})
    const containers = (await containersResponse.json()).containers
    setContainers(containers)
    setTakingAction(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2">
              <h3
                className="text-lg font-medium text-gray-900 truncate"
                title={container.name}
              >
                {displayName}
              </h3>
              <ContainerStatus
                status={container.status}
                state={container.state}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p
                className="text-sm text-gray-500 truncate"
                title={container.id}
              >
                ID: {container.id.substring(0, 12)}
              </p>
              <div className="flex items-center gap-2">
                  <div className="flex gap-2 hover:bg-gray-50 items-center p-2 max-w-max cursor-pointer rounded-full" onClick={()=>{
                    showDetails(container)
                  }}>
                    <EyeIcon className="w-3.5 h-3.5"/>
                  </div>
                  <div className={`flex gap-2 hover:bg-gray-50 items-center p-2 max-w-max rounded-full ${takingAction?"pointer-events-none":"cursor-pointer"}`} onClick={()=>{
                    editSelected(true)
                    showDetails(container)
                  }}>
                    <EditIcon className="w-3.5 h-3.5"/>
                  </div>
                  {!["running"].includes(container.status) && (
                    <div className={`flex gap-2 items-center p-2 max-w-max hover:bg-blue-50 text-blue-600 rounded-full ${takingAction?"pointer-events-none":"cursor-pointer"}`} onClick={async ()=>{
                      setTakingAction(true)
                      setActionType("rerun")
                      const responseObj = await fetch("/api/containers",{
                        headers:{
                          "Content-Type":"application/json"
                        },
                        method:"POST",
                        body: JSON.stringify({ action:"rerun",containerId:container.id }),
                      })
                      const responseData = (await responseObj.json())
                      if(responseData.error){
                        setTakingAction(false)
                        toast.error(responseData.message)
                      }else{
                        toast.success(responseData.message);
                        openShowDetailsAfterAction()
                      }
                    }}>
                      {takingAction && actionType === "rerun" ? (
                        <LoaderIcon className="w-3.5 h-3.5" />
                      ):(
                        <PlayIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                  {!["exited","paused","created"].includes(container.status) && (
                    <div className={`flex gap-2 items-center p-2 max-w-max hover:bg-yellow-50 text-yellow-600 rounded-full ${takingAction?"pointer-events-none":"cursor-pointer"}`} onClick={async ()=>{
                      setTakingAction(true)
                      setActionType("pause")
                      const responseObj = await fetch("/api/containers",{
                        method:"POST",
                        headers:{
                          "Content-Type":"application/json"
                        },
                        body: JSON.stringify({ action:"pause",containerId:container.id }),
                      })
                      const responseData = (await responseObj.json())
                      if(responseData.error){
                        setTakingAction(false)
                        toast.error(responseData.message)
                      }else{
                        toast.success(responseData.message);
                        openShowDetailsAfterAction()
                      }
                    }}>
                      {takingAction && actionType === "pause" ? (
                        <LoaderIcon className="w-3.5 h-3.5" />
                      ):(
                        <PauseIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                  {!["exited"].includes(container.status) && (
                    <div className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600 rounded-full ${takingAction?"pointer-events-none":"cursor-pointer"}`} onClick={async ()=>{
                      setTakingAction(true)
                      setActionType("stop")
                      const responseObj = await fetch("/api/containers",{
                        method:"POST",
                        headers:{
                          "Content-Type":"application/json"
                        },
                        body: JSON.stringify({ action:"stop",containerId:container.id }),
                      })
                      const responseData = (await responseObj.json())
                      if(responseData.error){
                        setTakingAction(false)
                        toast.error(responseData.message)
                      }else{
                        toast.success(responseData.message);
                        openShowDetailsAfterAction()
                      }
                    }}>
                      {takingAction && actionType === "stop" ? (
                        <LoaderIcon className="w-3.5 h-3.5" />
                      ):(
                        <Ban className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                  <div className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600  rounded-full ${takingAction?"pointer-events-none":"cursor-pointer"}`} onClick={async ()=>{
                    setTakingAction(true)
                    setActionType("remove")
                    const responseObj = await fetch("/api/containers",{
                      method:"POST",
                      headers:{
                        "Content-Type":"application/json"
                      },
                      body: JSON.stringify({ action:"remove",containerId:container.id }),
                    })
                    const responseData = (await responseObj.json())
                      if(responseData.error){
                        setTakingAction(false)
                        toast.error(responseData.message)
                      }else{
                        toast.success(responseData.message);
                        openShowDetailsAfterAction()
                      }
                  }}>
                    {takingAction && actionType === "remove" ? (
                        <LoaderIcon className="w-3.5 h-3.5" />
                      ):(
                        <TrashIcon className="w-3.5 h-3.5" />
                      )}
                  </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ContainerIcon className="w-4 h-4" />
              <span>Image</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500 truncate">
              {container.image}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Created At</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {formatDistanceToNow(new Date(container.created), {
                addSuffix: true,
              })}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{container.state.Running ? "Started" : "Last Ran"}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {formatDistanceToNow(new Date(container.state.StartedAt), {
                addSuffix: true,
              })}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last Stoped</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {/* check if FinishedAt is before createdAt, this will indicate that this conatiner is never stoped */}
              {formatDistanceToNow(new Date(container.state.FinishedAt), {
                addSuffix: true,
              })}
            </div>
          </div>

          <ContainerPorts enableScroll ports={Object.keys(container.ports||{}).length?container.ports:container.host_config.PortBindings} />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Box className="w-4 h-4" />
                <span>Env</span>
              </div>
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {container.env_vars?.map((item, index) => {
                    const parts = item.split("=");
                    const attribute = parts[0];
                    const value = parts.slice(1).join("=");
                    return (
                      <div key={index} className="text-sm text-gray-500 truncate">
                        {attribute} = {value}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
        </div>
      </div>
    </div>
  );
}

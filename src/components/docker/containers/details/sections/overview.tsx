import React from "react";

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
  CpuIcon,
  Clock,
  Box,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ContainerPorts } from "../../common/ContainerPorts";
import { formatBytes } from "@/libs/utils";

const Overview = ({ container }: { container: any }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
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
        <ContainerPorts
          ports={
            Object.keys(container.ports || {}).length
              ? container.ports
              : container.host_config.PortBindings
          }
          testSize="text-sm"
        />
        {container.host_config.CpuShares ? (
          <div className="">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CpuIcon className="w-3.5 h-3.5" />
              <span>CPUs</span>
            </div>
            <div className="my-1 px-2 text-sm text-gray-500">
              {container.host_config.CpuShares
                ? `${(
                    container.host_config.CpuShares /
                    Math.pow(
                      1024,
                      Math.floor(
                        Math.log(container.host_config.CpuShares) /
                          Math.log(1024)
                      )
                    )
                  ).toFixed(0)}`
                : "N/A"}
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
              {container.host_config.Memory
                ? formatBytes(container.host_config.Memory)
                : "N/A"}
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
              {container.host_config.MemoryReservation
                ? formatBytes(container.host_config.MemoryReservation)
                : "N/A"}
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
              {container.host_config.MemorySwap
                ? formatBytes(container.host_config.MemorySwap)
                : "N/A"}
            </div>
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-6 my-4"></div>
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
                          {Mode === "rw" && <FolderOpen className="w-4 h-4" />}
                          {Mode === "ro" && (
                            <FolderClosed className="w-4 h-4" />
                          )}
                        </React.Fragment>
                      )}
                      {Type === "tmpfs" && <MemoryStick className="w-4 h-4" />}
                    </div>
                    {Mode === "rw" && (
                      <ChevronsLeftRightEllipsisIcon className="w-4 h-4" />
                    )}
                    {Mode === "ro" && <MoveRightIcon className="w-4 h-4" />}
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
    </div>
  );
};

export default Overview;

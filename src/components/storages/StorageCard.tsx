import React, { useState } from "react";
import {
  Clock,
  TrashIcon,
  LoaderIcon,
  TagsIcon,
  HardDriveIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { StorageInfo } from "src/types/storage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface StorageCardProps {
  storage: StorageInfo;
  setStorages: React.Dispatch<React.SetStateAction<any[]>>;
}

export function StorageCard({ storage, setStorages }: StorageCardProps) {
  const [takingAction, setTakingAction] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const openShowDetailsAfterAction = async () => {
    const storagesResponse = await fetch("/api/storages", { method: "GET" });
    const storages = (await storagesResponse.json()).storages;
    setStorages(storages);
    setTakingAction(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex">
            {storage.inUse && (
              <Badge variant={"outline"} className="max-w-max bg-green-50 pointer-events-none">
                In Use
              </Badge>
            )}
          </div>
          <div
            className={`ml-[80%] flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600  rounded-full ${
              takingAction ? "pointer-events-none" : "cursor-pointer"
            }`}
            onClick={async () => {
              setTakingAction(true);
              setActionType("remove");
              const responseObj = await fetch("/api/storages", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action: "remove",
                  volume_id: storage.name,
                }),
              });
              const responseData = await responseObj.json();
              if (responseData.error) {
                setTakingAction(false);
                toast.error(responseData.message);
              } else {
                toast.success(responseData.message);
                openShowDetailsAfterAction();
              }
            }}
          >
            {takingAction && actionType === "remove" ? (
              <LoaderIcon className="w-3.5 h-3.5" />
            ) : (
              <TrashIcon className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HardDriveIcon className="w-4 h-4" />
              <span>Name</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500 break-words overflow-x-auto">
              {storage.name}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Created At</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {formatDistanceToNow(new Date(storage.created), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TagsIcon className="w-4 h-4" />
            <span>Tags</span>
          </div>
          <div className="space-y-1 text-sm text-gray-500 flex flex-col gap-2">
            {Object.keys(storage.labels || {})?.length ? (
              Object.keys(storage.labels).map((label) => (
                <Badge key={label} variant="secondary" className="max-w-max">
                  {label.split(".").pop()} : {storage.labels[label]}
                </Badge>
              ))
            ) : (
              <em>None</em>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

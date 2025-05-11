import React, { useState } from "react";
import {
  Clock,
  ContainerIcon,
  PlayIcon,
  TrashIcon,
  LoaderIcon,
  TagsIcon,
  HardDriveIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PackageInfo } from "src/types/package";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PackageCardProps {
  packageItem: PackageInfo;
  setPackages: React.Dispatch<React.SetStateAction<any[]>>;
}

// Utility function to format size into readable units (KB, MB, GB)
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

export function PackageCard({ packageItem, setPackages }: PackageCardProps) {
  const [takingAction, setTakingAction] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const openShowDetailsAfterAction = async () => {
    const packagessResponse = await fetch("/api/packges", { method: "GET" });
    const newPackages = (await packagessResponse.json()).packages;
    setPackages(newPackages);
    setTakingAction(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2 justify-between">
              <p
                className="text-sm text-gray-500 truncate"
                title={packageItem.id}
              >
                ID: {packageItem.id.substring(0, 12)}
              </p>
              <div className="flex items-center gap-2">
                  <div
                    className={`flex gap-2 items-center p-2 max-w-max hover:bg-blue-50 text-blue-600 rounded-full ${
                      takingAction ? "pointer-events-none" : "cursor-pointer"
                    }`}
                    onClick={async () => {
                      setTakingAction(true);
                      setActionType("rerun");
                      const responseObj = await fetch("/api/packges", {
                        headers: {
                          "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({
                          action: "run",
                          packageId: packageItem.id,
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
                    {takingAction && actionType === "rerun" ? (
                      <LoaderIcon className="w-3.5 h-3.5" />
                    ) : (
                      <PlayIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={`flex gap-2 items-center p-2 max-w-max hover:bg-red-50 text-red-600  rounded-full ${
                      takingAction ? "pointer-events-none" : "cursor-pointer"
                    }`}
                    onClick={async () => {
                      setTakingAction(true);
                      setActionType("remove");
                      const responseObj = await fetch("/api/packges", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          action: "remove",
                          packageId: packageItem.id,
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
              {packageItem.name}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Created At</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {formatDistanceToNow(new Date(packageItem.created), {
                addSuffix: true,
              })}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HardDriveIcon className="w-4 h-4" />
              <span>Size</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {formatSize(packageItem.virtual_size)}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TagsIcon className="w-4 h-4" />
            <span>Tags</span>
          </div>
          <div className="space-y-1 text-sm text-gray-500 flex flex-col gap-2">
            {packageItem.tags?.length ? (
              packageItem.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="max-w-max">
                  {tag.split(":")[1]}
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

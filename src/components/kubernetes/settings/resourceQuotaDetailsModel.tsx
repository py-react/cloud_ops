import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import ResourceQuota from "@/components/kubernetes/settings/resource-quota/view/resourceQuota";


const formatValue = (value: string): string => {
  if (value.endsWith("Gi")) {
    return value;
  } else if (parseFloat(value) >= 1024 && !value.includes("Gi")) {
    return `${(parseFloat(value) / 1024).toFixed(2)}Gi`;
  } else {
    return value;
  }
};

export const ResourceQuotaDetailsModel = ({
  open,
  onClose,
  quota,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
  quota: Record<string,any>;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[786px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{quota.name}</DialogTitle>
          <DialogDescription>
            Configure Resource quota in a namespace: {quota.namespace} in current context
          </DialogDescription>
        </DialogHeader>
        <div className="">
          <Card className="p-0 shadow-none bg-white border border-gray-200 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between">
                <Badge variant="outline" className="!font-extrabold">
                  {quota.name}
                </Badge>
                <span className="text-xs">
                  {quota.creation_timestamp
                    ? new Date(quota.creation_timestamp).toLocaleString()
                    : "Unknown"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quota.status.hard["requests.cpu"] && (
                <ResourceQuota
                  title="CPU Requests"
                  used={quota.status.used["requests.cpu"] || "0"}
                  limit={quota.status.hard["requests.cpu"]}
                  icon={<></>}
                />
              )}

              {quota.status.hard["limits.cpu"] && (
                <ResourceQuota
                  title="CPU Limits"
                  used={quota.status.used["limits.cpu"] || "0"}
                  limit={quota.status.hard["limits.cpu"]}
                  icon={<></>}
                />
              )}

              {quota.status.hard["requests.memory"] && (
                <ResourceQuota
                  title="Memory Requests"
                  used={formatValue(
                    quota.status.used["requests.memory"] || "0"
                  )}
                  limit={formatValue(quota.status.hard["requests.memory"])}
                  icon={<></>}
                />
              )}

              {quota.status.hard["limits.memory"] && (
                <ResourceQuota
                  title="Memory Limits"
                  used={formatValue(quota.status.used["limits.memory"] || "0")}
                  limit={formatValue(quota.status.hard["limits.memory"])}
                  icon={<></>}
                />
              )}
              {Object.keys(quota.status.hard).map((item) => {
                if (
                  [
                    "limits.memory",
                    "requests.memory",
                    "limits.cpu",
                    "requests.cpu",
                  ].includes(item)
                )
                  return null;
                return (
                  <ResourceQuota
                    title={item}
                    used={formatValue(quota.status.used[item] || "0")}
                    limit={formatValue(quota.status.hard[item])}
                    icon={<></>}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>
        {!Object.keys(quota.spec) ? (
          <p className="font-semibold text-center text-sm">
            No Resource Quota found for this namespace
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ResourceQuotaDetailsModel;

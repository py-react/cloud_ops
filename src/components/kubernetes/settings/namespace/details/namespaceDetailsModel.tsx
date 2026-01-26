import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-v2";
import { Badge } from "@/components/ui/badge";
import { Layers, FolderPlus, Settings, Search, Users } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import ResourceQuota from "@/components/kubernetes/settings/resource-quota/common/resourceQuota";

export interface ResourceLimit {
  cpu?: string;
  memory?: string;
  storage?: string;
}

export interface LimitRangeItem {
  type: string;
  default?: ResourceLimit | null;
  default_request?: ResourceLimit | null;
  max?: ResourceLimit | null;
  max_limit_request_ratio?: ResourceLimit | null;
  min?: ResourceLimit | null;
}

export interface LimitRange {
  name: string;
  namespace: string;
  spec: {
    limits: LimitRangeItem[];
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
  creation_timestamp: string;
}

export interface TransformedResource {
  name: string;
  min: string;
  max: string;
  default: string;
  defaultRequest: string;
  maxLimitRequestRatio: string;
}

export interface TransformedLimit {
  type: string;
  resources: TransformedResource[];
}

export interface TransformedLimitRange {
  name: string;
  namespace: string;
  creationTimestamp: string;
  limits: TransformedLimit[];
}

const getResourceValue = (
  resource: ResourceLimit | null | undefined,
  key: keyof ResourceLimit
): string => {
  if (!resource || !resource[key]) return "-";
  return resource[key] as string;
};

const transformLimit = (limit: LimitRangeItem): TransformedLimit => {
  const resources: TransformedResource[] = ["cpu", "memory", "storage"]
    .map((resourceName) => {
      const hasResource =
        (limit.min && limit.min[resourceName as keyof ResourceLimit]) ||
        (limit.max && limit.max[resourceName as keyof ResourceLimit]) ||
        (limit.default && limit.default[resourceName as keyof ResourceLimit]) ||
        (limit.default_request &&
          limit.default_request[resourceName as keyof ResourceLimit]) ||
        (limit.max_limit_request_ratio &&
          limit.max_limit_request_ratio[resourceName as keyof ResourceLimit]);

      if (!hasResource) return null;

      return {
        name: resourceName,
        min: getResourceValue(limit.min, resourceName as keyof ResourceLimit),
        max: getResourceValue(limit.max, resourceName as keyof ResourceLimit),
        default: getResourceValue(
          limit.default,
          resourceName as keyof ResourceLimit
        ),
        defaultRequest: getResourceValue(
          limit.default_request,
          resourceName as keyof ResourceLimit
        ),
        maxLimitRequestRatio: getResourceValue(
          limit.max_limit_request_ratio,
          resourceName as keyof ResourceLimit
        ),
      };
    })
    .filter((resource): resource is TransformedResource => resource !== null);

  return {
    type: limit.type,
    resources,
  };
};

export const transformLimitRange = (
  limitRange: LimitRange
): TransformedLimitRange => {
  return {
    name: limitRange.name,
    namespace: limitRange.namespace,
    creationTimestamp: limitRange.creation_timestamp,
    limits: limitRange.spec.limits.map(transformLimit),
  };
};

// Navigation items with icons
const navigationItems = [
  {
    id: "basic",
    title: "Basic",
    icon: <FolderPlus className="h-5 w-5" />,
  },
  {
    id: "quota",
    title: "Resources Quota",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "limitRange",
    title: "Limit Range",
    icon: <FolderPlus className="h-5 w-5" />,
  },
];

const formatValue = (value: string): string => {
  if (value.endsWith("Gi")) {
    return value;
  } else if (parseFloat(value) >= 1024 && !value.includes("Gi")) {
    return `${(parseFloat(value) / 1024).toFixed(2)}Gi`;
  } else {
    return value;
  }
};

export const NamespaceDetailsModel = ({
  open,
  onClose,
  viewNamespaceData,
  filteredQuotas,
  filteredLimitRange,
}) => {
  const [activeSection, setActiveSection] = useState("basic");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[786px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {viewNamespaceData?.metadata?.name}
          </DialogTitle>
          <DialogDescription>
            Configure namespace in a Kubernetes cluster in current context
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={activeSection}
          onValueChange={setActiveSection}
          className="space-y-6  min-h-[500px] max-h-[500px]"
        >
          <TabsList className="bg-white rounded-[0.5rem] h-auto p-1.5 mb-8 flex w-full shadow-sm border border-gray-100">
            {navigationItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex-1 py-2.5 px-4 flex flex-col items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-[calc(0.5rem-2px)] transition-all duration-200"
              >
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="basic" className="mt-0 overflow-y-auto max-h-[376px]">
            <Card className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 border border-gray-200">
              <div>
                <h3 className="font-semibold text-sm mb-2">Name</h3>
                <p className="text-xs">{viewNamespaceData?.metadata?.name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">Creation Time</h3>
                <p className="text-xs">
                  {viewNamespaceData?.metadata.creation_timestamp
                    ? new Date(
                      viewNamespaceData.metadata.creation_timestamp
                    ).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
              <div className="col-span-2">
                <h3 className="font-semibold text-sm mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(viewNamespaceData?.labels || {}).length > 0 ? (
                    Object.entries(viewNamespaceData.labels || {}).map(
                      ([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="px-2 py-1 text-xs"
                        >
                          {key}: {value}
                        </Badge>
                      )
                    )
                  ) : (
                    <span className="text-gray-500 text-xs">No labels</span>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="quota" className="mt-0 overflow-y-auto max-h-[376px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
              {filteredQuotas?.map((quota) => {
                return (
                  <Card className="p-0 shadow-none bg-white border border-gray-200 w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-extrabold flex items-center justify-between">
                        <Badge variant="outline" className="!font-extrabold">
                          {quota.name}
                        </Badge>
                        <span className="text-xs">
                          {quota.creation_timestamp
                            ? new Date(
                              quota.creation_timestamp
                            ).toLocaleString()
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
                          limit={formatValue(
                            quota.status.hard["requests.memory"]
                          )}
                          icon={<></>}
                        />
                      )}

                      {quota.status.hard["limits.memory"] && (
                        <ResourceQuota
                          title="Memory Limits"
                          used={formatValue(
                            quota.status.used["limits.memory"] || "0"
                          )}
                          limit={formatValue(
                            quota.status.hard["limits.memory"]
                          )}
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
                );
              })}
            </div>
            {!filteredQuotas.length ? (
              <p className="font-semibold text-center text-sm">No Resource Quota found for this namespace</p>
            ) : null}
          </TabsContent>
          <TabsContent value="limitRange" className="mt-0 overflow-y-auto max-h-[376px]">
            <div className="space-y-6">
              {!!filteredLimitRange.length ? filteredLimitRange.map((limitRange: LimitRange) => {
                const newLimitRange = transformLimitRange(limitRange);
                return (
                  <Card className="p-0 shadow-none bg-white border border-gray-200 w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-extrabold flex items-center justify-between mb-2">
                        <Badge variant="outline" className="!font-extrabold">
                          {newLimitRange.name}
                        </Badge>
                        <span className="text-xs">
                          {newLimitRange.creationTimestamp
                            ? new Date(
                              newLimitRange.creationTimestamp
                            ).toLocaleString()
                            : "Unknown"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {newLimitRange.limits.map((limit) => {
                        const resources = limit.resources;
                        return (
                          <div>
                            <h2 className="text-lg font-semibold mb-2">
                              {limit.type} Limits
                            </h2>
                            <ResourceTable
                              className="p-0"
                              columns={[
                                {
                                  header: "Resource",
                                  accessor: "name",
                                },
                                {
                                  header: "Min",
                                  accessor: "min",
                                },
                                {
                                  header: "Max",
                                  accessor: "max",
                                },
                                {
                                  header: "Default",
                                  accessor: "default",
                                },
                                {
                                  header: "Default Request",
                                  accessor: "defaultRequest",
                                },
                                {
                                  header: "Max Limit/Request Ratio",
                                  accessor: "maxLimitRequestRatio",
                                },
                              ]}
                              data={resources}
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              }) : (
                <p className="font-semibold text-center text-sm">No Limit range found for this namespace</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NamespaceDetailsModel;

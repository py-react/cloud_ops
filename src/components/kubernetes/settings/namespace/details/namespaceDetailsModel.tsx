import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Settings, Shield, Info, Clock, Tag } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import ResourceQuota from "@/components/kubernetes/settings/resource-quota/common/resourceQuota";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";

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

const formatValue = (value: string): string => {
  if (value.endsWith("Gi")) {
    return value;
  } else if (parseFloat(value) >= 1024 && !value.includes("Gi")) {
    return `${(parseFloat(value) / 1024).toFixed(2)}Gi`;
  } else {
    return value;
  }
};

// --- Wizard Step Components ---

const BasicsStep = ({ data }: { data: any, control?: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4 shadow-none bg-muted/20 border-border/40">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Namespace Name</div>
            <div className="text-sm font-semibold text-foreground">{data?.metadata?.name || "N/A"}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-none bg-muted/20 border-border/40">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Creation Time</div>
            <div className="text-sm font-semibold text-foreground">
              {data?.metadata?.creation_timestamp
                ? new Date(data.metadata.creation_timestamp).toLocaleString()
                : "Unknown"}
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Card className="shadow-none bg-muted/10 border-border/40">
      <CardHeader className="py-3 px-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Labels</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(data?.labels || {}).length > 0 ? (
            Object.entries(data.labels || {}).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="px-2 py-0.5 text-[11px] font-medium bg-background border-border/50">
                {key}: <span className="text-primary ml-1">{value as string}</span>
              </Badge>
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic py-2">No labels configured</div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

const QuotaStep = ({ quotas }: { quotas: any[], control?: any }) => (
  <div className="space-y-6">
    {quotas && quotas.length > 0 ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quotas.map((quota, idx) => (
          <Card key={idx} className="p-0 shadow-none bg-white border border-border/40 overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{quota.name}</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {quota.creation_timestamp ? new Date(quota.creation_timestamp).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <CardContent className="p-4 space-y-3">
              {quota.status.hard["requests.cpu"] && (
                <ResourceQuota
                  title="CPU Requests"
                  used={quota.status.used["requests.cpu"] as any || "0"}
                  limit={quota.status.hard["requests.cpu"] as any}
                  icon={<></>}
                />
              )}
              {quota.status.hard["limits.cpu"] && (
                <ResourceQuota
                  title="CPU Limits"
                  used={quota.status.used["limits.cpu"] as any || "0"}
                  limit={quota.status.hard["limits.cpu"] as any}
                  icon={<></>}
                />
              )}
              {quota.status.hard["requests.memory"] && (
                <ResourceQuota
                  title="Memory Requests"
                  used={formatValue(quota.status.used["requests.memory"] || "0") as any}
                  limit={formatValue(quota.status.hard["requests.memory"]) as any}
                  icon={<></>}
                />
              )}
              {quota.status.hard["limits.memory"] && (
                <ResourceQuota
                  title="Memory Limits"
                  used={formatValue(quota.status.used["limits.memory"] || "0") as any}
                  limit={formatValue(quota.status.hard["limits.memory"]) as any}
                  icon={<></>}
                />
              )}
              {Object.keys(quota.status.hard).map((item) => {
                if (["limits.memory", "requests.memory", "limits.cpu", "requests.cpu"].includes(item)) return null;
                return (
                  <ResourceQuota
                    key={item}
                    title={item}
                    used={formatValue(quota.status.used[item] || "0") as any}
                    limit={formatValue(quota.status.hard[item]) as any}
                    icon={<></>}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-border/40">
        <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
          <Settings className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Resource Quotas</h3>
        <p className="text-xs text-muted-foreground mt-1">No resource quotas are defined for this namespace.</p>
      </div>
    )}
  </div>
);

const LimitRangeStep = ({ limitRanges }: { limitRanges: any[], control?: any }) => (
  <div className="space-y-6">
    {limitRanges && limitRanges.length > 0 ? (
      <div className="space-y-6">
        {limitRanges.map((limitRange: LimitRange, idx) => {
          const transformed = transformLimitRange(limitRange);
          return (
            <Card key={idx} className="p-0 shadow-none bg-white border border-border/40 overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b border-border/20 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{transformed.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {transformed.creationTimestamp ? new Date(transformed.creationTimestamp).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <CardContent className="p-0">
                {transformed.limits.map((limit, lIdx) => (
                  <div key={lIdx} className="p-4 space-y-4 border-b last:border-b-0 border-border/10">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {limit.type} Limits
                    </h4>
                    <ResourceTable
                      className="p-0 border-none shadow-none"
                      columns={[
                        { header: "Resource", accessor: "name" },
                        { header: "Min", accessor: "min" },
                        { header: "Max", accessor: "max" },
                        { header: "Default", accessor: "default" },
                        { header: "Default Req.", accessor: "defaultRequest" },
                      ]}
                      data={limit.resources as any}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-border/40">
        <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Limit Ranges</h3>
        <p className="text-xs text-muted-foreground mt-1">No limit ranges are configured for this namespace.</p>
      </div>
    )}
  </div>
);

// --- Main Component ---

export const NamespaceDetailsModel = ({
  open,
  onClose,
  viewNamespaceData,
  filteredQuotas,
  filteredLimitRange,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
  viewNamespaceData: any;
  filteredQuotas: any[];
  filteredLimitRange: any[];
}) => {
  const [currentStep, setCurrentStep] = useState("basics");

  const steps = [
    {
      id: "basics",
      label: "Basic Info",
      description: "Namespace details",
      longDescription: "View basic information about the namespace, including its labels and creation time.",
      icon: Folder,
      component: BasicsStep,
      props: { data: viewNamespaceData },
    },
    {
      id: "quota",
      label: "Resource Quotas",
      description: "Usage limits",
      longDescription: "Monitor resource quotas and usage for CPU, memory, and other Kubernetes resources.",
      icon: Settings,
      component: QuotaStep,
      props: { quotas: filteredQuotas },
    },
    {
      id: "limitRange",
      label: "Limit Ranges",
      description: "Default constraints",
      longDescription: "View default resource requests and limits for containers and pods within this namespace.",
      icon: Shield,
      component: LimitRangeStep,
      props: { limitRanges: filteredLimitRange },
    },
  ];

  return (
    <FormWizard
      name="view-namespace-details"
      isWizardOpen={open}
      setIsWizardOpen={onClose}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      steps={steps}
      schema={z.any()}
      initialValues={{}}
      onSubmit={async () => { }} // No-op for viewing
      hideActions={true} // View-only
      heading={{
        primary: viewNamespaceData?.metadata?.name || "Namespace Details",
        secondary: "Detailed configuration and resource constraints for the namespace",
        icon: Folder,
      }}
    />
  );
};

export default NamespaceDetailsModel;

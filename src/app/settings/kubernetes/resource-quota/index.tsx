import { Settings, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ResourceQuotaDetailsModel from "@/components/kubernetes/settings/resource-quota/details/resourceQuotaDetails";
import { IResourceQuota } from "@/components/kubernetes/settings/resource-quota/types/quota";
import RouteDescription from "@/components/route-description";
import yaml from 'js-yaml';
import ResourceForm from "@/components/resource-form/resource-form";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Request CPU", accessor: "requestCpu" },
  { header: "Limit CPU", accessor: "limitCpu" },
  { header: "Request Memory", accessor: "requestMemory" },
  { header: "Limit Memory", accessor: "limitMemory" },
  { header: "Created At", accessor: "createdAt" },
];

export const ResourceQuota = () => {
  const [resourcesQuota, setResourcesQuota] = useState<IResourceQuota[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentToShow, setCurrentToShow] = useState<IResourceQuota | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editDetails, setEditDetails] = useState(false);

  const fetchResourceQuota = () => {
    DefaultService.apiKubernertesResourceQuotaGet()
      .then((res: any) => {
        setResourcesQuota(res || []);
      })
      .catch((err) => {
        toast.error(err);
      });
  };

  const filteredQuotas =
    resourcesQuota?.filter(
      (quotas) =>
        quotas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotas.namespace?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Transform data for ResourceTable
  const tableData = filteredQuotas.map((quota) => ({
    ...quota,
    requestCpu: `${quota.status?.used?.["requests.cpu"] || "0"}/${quota.status?.hard?.["requests.cpu"] || "0"}`,
    limitCpu: `${quota.status?.used?.["limits.cpu"] || "0"}/${quota.status?.hard?.["limits.cpu"] || "0"}`,
    requestMemory: `${quota.status?.used?.["requests.memory"] || "0"}/${quota.status?.hard?.["requests.memory"] || "0"}`,
    limitMemory: `${quota.status?.used?.["limits.memory"] || "0"}/${quota.status?.hard?.["limits.memory"] || "0"}`,
    createdAt: quota.creation_timestamp
      ? new Date(quota.creation_timestamp).toLocaleString()
      : "Unknown",
  }));

  useEffect(() => {
    fetchResourceQuota();
  }, []);

  return (
    <div title="Kubernetes Resource quota">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h2>Kubernetes resource quota management</h2>
            </div>
          }
          shortDescription="Manage resource limits for namespaces in your Kubernetes cluster"
          description="Resource quotas provide constraints that limit aggregate
                resource consumption per namespace. They can limit the quantity
                of objects that can be created in a namespace by type, as well
                as the total amount of compute resources that may be consumed by
                resources in that namespace"
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Active Quotas</CardTitle>
              <CardDescription>
                Resource quotas across all namespaces
              </CardDescription>
            </div>

            <div className=" flex items-center gap-2">
              <Button
                onClick={() => {
                  setCurrentToShow(null);
                  setEditDetails(true);
                }}
              >
                <Settings size={18} />
                Create Quota
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contexts..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ResourceTable
              columns={columns}
              data={tableData}
              onViewDetails={(resource) => {
                setCurrentToShow(resource);
                setShowDetails(true);
              }}
              onEdit={(resource) => {
                setCurrentToShow(resource);
                setEditDetails(true);
              }}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
      {showDetails && currentToShow && (
        <ResourceQuotaDetailsModel
          quota={currentToShow}
          open={showDetails}
          onClose={(open) => {
            setCurrentToShow(null);
            setShowDetails(open);
          }}
          onDelete={(data) => {
            DefaultService.apiKubernertesMethodsDeletePost({
              requestBody: {
                manifest: yaml.dump(data.last_applied) || "",
              },
            })
              .then((res: any) => {
                if (res.success) {
                  toast.success(res.data.message);
                  fetchResourceQuota();
                  setEditDetails(false);
                  setShowDetails(false)
                } else {
                  toast.error(res.error);
                }
              })
              .catch((err) => {
                toast.error(err);
              });
          }}
        />
      )}
      {editDetails && (
        <ResourceForm
          heading="Resource-quota resource"
          description="A Kubernetes ResourceQuota is a resource used to limit the aggregate resource consumption (such as CPU, memory, and storage) within a namespace. It helps enforce fair usage and prevent any single team or application from consuming more than its share of cluster resources. By setting quotas on compute, object counts, or storage, ResourceQuotas provide control and governance in multi-tenant environments, ensuring efficient and balanced resource allocation across workloads."
          editDetails={editDetails}
          rawYaml={currentToShow ? yaml.dump(currentToShow.last_applied) : ""}
          resourceType="resourcequota"
          onClose={() => {
            setCurrentToShow(null);
            setEditDetails(false);
          }}
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res: any) => {
                if (res.success) {
                  setCurrentToShow(null);
                  toast.success(res.data.message);
                  fetchResourceQuota();
                  setEditDetails(false);
                } else {
                  toast.error(res.error);
                }
              })
              .catch((err) => {
                toast.error(err);
              });
          }}
        />
      )}
    </div>
  );
};
export default ResourceQuota;

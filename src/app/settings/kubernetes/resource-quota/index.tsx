import { Settings, Search, RefreshCw, Activity } from "lucide-react";
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
import yaml from 'js-yaml';
import ResourceForm from "@/components/resource-form/resource-form";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import PageLayout from "@/components/PageLayout";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";

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
  const [isLoading, setIsLoading] = useState(false);

  const fetchResourceQuota = () => {
    setIsLoading(true);
    DefaultService.apiKubernertesResourceQuotaGet()
      .then((res: any) => {
        setResourcesQuota(res || []);
      })
      .catch((err) => {
        toast.error(err);
      })
      .finally(() => {
        setIsLoading(false);
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
    <PageLayout
      title="Resource Quotas"
      subtitle="Manage resource limits for namespaces in your Kubernetes cluster. Resource quotas provide constraints that limit aggregate resource consumption per namespace."
      icon={Settings}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={fetchResourceQuota} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              setCurrentToShow(null);
              setEditDetails(true);
            }}
          >
            <Settings size={18} className="mr-2" />
            Create Quota
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total Quotas"
            count={resourcesQuota.length}
            icon={<Activity className="w-4 h-4" />}
            color="bg-amber-500"
            className="border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all"
            isLoading={isLoading}
          />
        </div>

        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Active Quotas</CardTitle>
              <CardDescription>
                Resource quotas across all namespaces
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6 pb-4">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quotas..."
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
              className="mt-0"
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
    </PageLayout>
  );
};

export default ResourceQuota;

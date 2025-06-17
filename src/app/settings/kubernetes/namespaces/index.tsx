import React, { useContext, useEffect, useState } from "react";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DefaultService } from "@/gingerJs_api_client";
import { Folder, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { CreateNamespace } from "@/components/kubernetes/settings/createNamespace";
import NamespaceDetailsModel from "@/components/kubernetes/settings/namespaceDetailsModel";
import RouteDescription from "@/components/route-description";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";

const columns = [
  { accessor: "metadata.name", header: "Name" },
  { accessor: "status.phase", header: "Status" },
  { accessor: "metadata.creation_timestamp", header: "Created At" },
];


export const Namespaces = () => {
  const [resourcesQuota, setResourcesQuota] = useState([]);
  const [limitRanges, setLimitRanges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [limitRangeSearchTerm, setLimitRangeSearchTerm] = useState("");
  const [viewNamespaceData, setViewNamespaceData] = useState({});
  const [showDetails, setShowDetails] = useState(false);

  const { isLoading, namespaces, fetchNamespaces, selectedNamespace, error } =
    useContext(NamespaceContext);

  const fetchResourceQuotas = async (namespace) => {
    const response =
      await DefaultService.apiKubernertesResourceQuotaGet({namespace}).catch((err) => {
        toast.error(err as string);
      });
    console.log({ response });
    setResourcesQuota(response);
  };

  const deleteNamespace = async (namespace) => {
    await DefaultService.apiKubernertesClusterNamespaceDelete({
      name: namespace,
    })
      .then((res) => {
        if (res.status === "success") {
          toast.success(`Namespace successfully delete: ${namespace}`);
          fetchNamespaces();
        } else {
          toast.success(`Error while deleting ${namespace}: ${res.message}`);
        }
      })
      .catch((err) => {
        toast.error(err as string);
      });
  };

  const fetchLimitRange = async (namespace) => {
    const response =
      await DefaultService.apiKubernertesLimitRangeGet({namespace}).catch((err) => {
        toast.error(err as string);
      });
    console.log({ response });
    setLimitRanges(response);
  };

  const currentResourceQuota =
    resourcesQuota?.filter(
      (item) => item.namespace === selectedNamespace
    )?.[0] || {};

  const filteredNamespaces =
    namespaces?.filter((namespace) =>
      namespace.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredQuotas =
    isLoading ? [] : resourcesQuota?.filter(
      (quotas) =>
        quotas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotas.namespace?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredLimitRange =
    limitRanges?.filter(
      (limitRange) =>
        limitRange.name
          .toLowerCase()
          .includes(limitRangeSearchTerm.toLowerCase()) ||
        limitRange.namespace
          ?.toLowerCase()
          .includes(limitRangeSearchTerm.toLowerCase())
    ) || [];

    return (
    <div title="Kubernetes namespace">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <h2>Kubernetes Namespace management</h2>
            </div>
          }
          shortDescription="Manage your Kubernetes namespaces—add new ones, view details, or remove existing namespaces with ease."
          description="Namespaces in Kubernetes are virtual clusters within a physical cluster, used to isolate and organize resources like pods, services, and deployments. They help manage environments (e.g., dev, test, prod) and control access at a granular level."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center justify-between">
                <h2>Current namespace</h2>
                <NamespaceSelector />
              </div>
            </CardTitle>
            <CardDescription>
              The active namespace for the current context
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Namespace Name
              </div>
              <div className="font-medium flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {selectedNamespace || ""}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Available Namespaces</CardTitle>
              <CardDescription>
                All configured Kubernetes namespaces for the current context
              </CardDescription>
            </div>
            <div className=" flex items-center gap-2">
              <CreateNamespace />
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
              onViewDetails={(data) => {
                setViewNamespaceData(data);
                fetchResourceQuotas(data.metadata.name);
                fetchLimitRange(data.metadata.name);
                setShowDetails(true);
              }}
              onDelete={(data) => {
                deleteNamespace(data.metadata.name);
              }}
              columns={columns}
              data={filteredNamespaces}
            />
          </CardContent>
        </Card>
      </div>
      {showDetails && (
        <NamespaceDetailsModel
          open={showDetails}
          onClose={(open) => {
            setShowDetails(open);
            setViewNamespaceData({});
            setLimitRanges([]);
            setResourcesQuota([]);
          }}
          viewNamespaceData={viewNamespaceData}
          filteredLimitRange={filteredLimitRange}
          filteredQuotas={filteredQuotas}
        />
      )}
    </div>
  );
};

export default Namespaces;

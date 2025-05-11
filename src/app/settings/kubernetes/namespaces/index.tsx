import React, { useContext, useEffect, useState } from "react";
import { NamespaceContext } from "@/components/kubernetes/context/NamespaceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DefaultService } from "@/gingerJs_api_client";
import { FolderPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { CreateNamespace } from "@/components/kubernetes/settings/createNamespace";
import NamespaceDetailsModel from "@/components/kubernetes/settings/namespaceDetailsModel";

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
    const response =
      await DefaultService.apiKubernertesClusterNamespaceDelete({name:namespace}).then(res=>{
            if(res.status === "success"){
                fetchNamespaces()
                toast.success(`Namespace successfully delete: ${namespace}`)
            }else{
                toast.success(`Error while deleting ${namespace}: ${res.message}`)
            }
      }).catch((err) => {
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
    resourcesQuota?.filter(
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

  useEffect(() => {
    if (!isLoading && !!error) {
      fetchNamespaces();
    }
  }, [isLoading, error]);

  return (
    <div title="Kubernetes namespace">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderPlus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Kubernetes Namespace</h1>
        </div>
      </div>
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Current Namespace</CardTitle>
            <CardDescription>
              The active namespace for the current context
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Namespace Name
                </div>
                <div className="font-medium flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  {selectedNamespace || ""}
                </div>
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

            <div className="w-full flex items-center max-w-sm gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contexts..."
                  className="w-full pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <CreateNamespace />
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              onViewDetails={(data) => {
                setViewNamespaceData(data);
                fetchResourceQuotas(data.metadata.name)
                fetchLimitRange(data.metadata.name)
                setShowDetails(true);
              }}
              onDelete={(data)=>{
                deleteNamespace(data.metadata.name)
              }}
              columns={columns}
              data={filteredNamespaces}
            />
          </CardContent>
        </Card>
      </div>
      {showDetails && (
        <NamespaceDetailsModel open={showDetails} onClose={(open)=>{
            setShowDetails(open)
            setViewNamespaceData({});
            setLimitRanges([])
            setResourcesQuota([])
        }} viewNamespaceData={viewNamespaceData} filteredLimitRange={filteredLimitRange} filteredQuotas={filteredQuotas} />
      )}
    </div>
  );
};

export default Namespaces;

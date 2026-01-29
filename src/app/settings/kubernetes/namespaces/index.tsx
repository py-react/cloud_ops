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
import { Folder, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { CreateNamespace } from "@/components/kubernetes/settings/namespace/form/createNamespace";
import NamespaceDetailsModel from "@/components/kubernetes/settings/namespace/details/namespaceDetailsModel";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import PageLayout from "@/components/PageLayout";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


export const Namespaces = () => {
  const [resourcesQuota, setResourcesQuota] = useState([]);
  const [limitRanges, setLimitRanges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [limitRangeSearchTerm, setLimitRangeSearchTerm] = useState("");
  const [viewNamespaceData, setViewNamespaceData] = useState({});
  const [showDetails, setShowDetails] = useState(false);

  const { isLoading, namespaces, fetchNamespaces, selectedNamespace, error } =
    useContext(NamespaceContext);

  const fetchResourceQuotas = async (namespace: string) => {
    try {
      const response: any = await DefaultService.apiKubernertesResourceQuotaGet({ namespace });
      setResourcesQuota(response || []);
    } catch (err) {
      toast.error(err as string);
    }
  };

  const deleteNamespace = async (namespace: string) => {
    try {
      const res: any = await DefaultService.apiKubernertesClusterNamespaceDelete({
        name: namespace,
      });
      if (res.status === "success") {
        toast.success(`Namespace successfully deleted: ${namespace}`);
        fetchNamespaces();
      } else {
        toast.error(`Error while deleting ${namespace}: ${res.message}`);
      }
    } catch (err) {
      toast.error(err as string);
    }
  };

  const fetchLimitRange = async (namespace: string) => {
    try {
      const response: any = await DefaultService.apiKubernertesLimitRangeGet({ namespace });
      setLimitRanges(response || []);
    } catch (err) {
      toast.error(err as string);
    }
  };

  const filteredNamespaces =
    namespaces?.filter((namespace: any) =>
      namespace.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredQuotas =
    isLoading ? [] : resourcesQuota?.filter(
      (quotas: any) =>
        quotas.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotas.namespace?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredLimitRange =
    limitRanges?.filter(
      (limitRange: any) =>
        limitRange.name
          ?.toLowerCase()
          .includes(limitRangeSearchTerm.toLowerCase()) ||
        limitRange.namespace
          ?.toLowerCase()
          .includes(limitRangeSearchTerm.toLowerCase())
    ) || [];

  return (
    <PageLayout
      title="Kubernetes Namespaces"
      subtitle={
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1">
            Manage your Kubernetes namespaces—add new ones, view details, or remove existing namespaces.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              <Folder className="h-3 w-3" />
              {selectedNamespace || "default"}
            </div>
          </div>
        </div>
      }
      icon={Folder}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <NamespaceSelector />
          <Button variant="outline" onClick={fetchNamespaces} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total Namespaces"
            count={namespaces?.length || 0}
            icon={<Folder className="w-4 h-4" />}
            color="bg-blue-500"
            className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
            isLoading={isLoading}
          />
        </div>


        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-lg">Available Namespaces</CardTitle>
              <CardDescription>
                All configured Kubernetes namespaces for the current context
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search namespaces..."
                  className="w-full pl-9 bg-background h-9 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <CreateNamespace />
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none border-t border-gray-100">
            <ResourceTable
              onViewDetails={(data: any) => {
                setViewNamespaceData(data);
                fetchResourceQuotas(data.metadata.name);
                fetchLimitRange(data.metadata.name);
                setShowDetails(true);
              }}
              onDelete={(data: any) => {
                deleteNamespace(data.metadata.name);
              }}
              columns={[
                { accessor: "metadata.name", header: "Name" },
                {
                  accessor: "status.phase",
                  header: "Status",
                  cell: (row: any) => {
                    const status = row.status?.phase;
                    const variant = status === 'Active' ? 'success' : 'warning';
                    return <Badge variant={variant as any} className="gap-1.5 text-xs">
                      {status === 'Active' && <div className="w-1 h-1 rounded-full bg-current animate-pulse" />}
                      {status}
                    </Badge>
                  }
                },
                {
                  accessor: "metadata.creation_timestamp",
                  header: "Created At",
                  cell: (row: any) => row.metadata?.creation_timestamp ? new Date(row.metadata.creation_timestamp).toLocaleString() : 'Unknown'
                },
              ]}
              data={filteredNamespaces}
            />
          </CardContent>
        </Card>
      </div>
      {showDetails && (
        <NamespaceDetailsModel
          open={showDetails}
          onClose={(open: boolean) => {
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
    </PageLayout>
  );
};

export default Namespaces;

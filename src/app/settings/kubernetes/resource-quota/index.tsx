import { Settings, Search, Edit2, PlusIcon } from "lucide-react";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import ResourceQuotaDetailsModel from "@/components/kubernetes/settings/resourceQuotaDetailsModel";
import ResourceQuotaDetails from "@/components/kubernetes/settings/resource-quota/resourceQuotaDetails";
import { ResourceQuota as ResourceQuotaType } from "@/components/kubernetes/settings/resource-quota/types/quota";
import RouteDescription from "@/components/route-description";

const columns = [
  { header: "Name" },
  { header: "Namespace" },
  { header: "Request Cpu" },
  { header: "Limit Cpu" },
  { header: "Request Memory" },
  { header: "Limit Memory" },
  { header: "Created At" },
];

export const ResourceQuota = () => {
  const [resourcesQuota, setResourcesQuota] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentToShow, setCurrentToShow] = useState({} as ResourceQuotaType);
  const [showDetails, setShowDetails] = useState(false);
  const [editDetails, setEditDetails] = useState(false);

  const fetchResourceQuota = () => {
    DefaultService.apiKubernertesResourceQuotaGet()
      .then((res) => {
        setResourcesQuota(res);
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
                  setCurrentToShow({});
                  setEditDetails(true);
                }}
              >
                <PlusIcon size={18} />
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
            <Card className="shadow-none">
              <div className="rounded-[calc(0.5rem-2px)] border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.header}>
                          {column.header}
                        </TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!!filteredQuotas.length ? (
                      filteredQuotas.map((row, index) => (
                        <TableRow>
                          {columns.map((column) => (
                            <TableCell key={column.header}>
                              {column.header === "Name" && row.name}
                              {column.header === "Namespace" && row.namespace}
                              {column.header === "Limit Cpu" && (
                                <>
                                  {row.status?.used?.["limits.cpu"]}/
                                  {row.status?.hard?.["limits.cpu"]}
                                </>
                              )}
                              {column.header === "Request Cpu" && (
                                <>
                                  {row.status?.used?.["requests.cpu"]}/
                                  {row.status?.hard?.["requests.cpu"]}
                                </>
                              )}
                              {column.header === "Limit Memory" && (
                                <>
                                  {row.status?.used?.["limits.memory"]}/
                                  {row.status?.hard?.["limits.memory"]}
                                </>
                              )}
                              {column.header === "Request Memory" && (
                                <>
                                  {row.status?.used?.["requests.memory"]}/
                                  {row.status?.hard?.["requests.memory"]}
                                </>
                              )}
                              {column.header === "Created At" &&
                                (row.creation_timestamp
                                  ? new Date(
                                      row.creation_timestamp
                                    ).toLocaleString()
                                  : "Unknown")}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center justify-start gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowDetails(true);
                                  setCurrentToShow(row);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Details</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditDetails(true);
                                  setCurrentToShow(row);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1}
                          className="h-24 text-center"
                        >
                          No resources found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </CardContent>
        </Card>
      </div>
      {showDetails && (
        <ResourceQuotaDetailsModel
          quota={currentToShow}
          open={showDetails}
          onClose={(open) => {
            setCurrentToShow({});
            setShowDetails(open);
          }}
        />
      )}
      {editDetails && (
        <ResourceQuotaDetails
          quotaName={currentToShow.name}
          quota={currentToShow}
          onClose={() => {
            setCurrentToShow({});
            setEditDetails(false);
          }}
          onDelete={(data) => {
            DefaultService.apiKubernertesMethodsDeletePost({
              requestBody: {
                manifest: data || "",
              },
            })
              .then((res) => {
                if (res.success) {
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
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res) => {
                if (res.success) {
                  setCurrentToShow({});
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

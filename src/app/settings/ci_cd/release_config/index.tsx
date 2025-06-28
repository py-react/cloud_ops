import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileCog } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import RouteDescription from "@/components/route-description";
import { ReleaseConfigDetails } from "../../../../components/ciCd/releaseConfig/details/ReleaseConfigDetails";
import ReleaseConfigForm from "@/components/ciCd/releaseConfig/forms/ReleaseConfigForm";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { ReleaseConfigFilters } from "@/components/ciCd/releaseConfig/common/ReleaseConfigFilters";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";

const columns = [
  { header: "Deployment Name", accessor: "deployment_name" },
  { header: "Source Control", accessor: "code_source_control_name" },
  { header: "Labels", accessor: "labels" },
  { header: "Status", accessor: "status" },
];

const ReleaseConfigPage = () => {
  const { selectedNamespace } = useContext(NamespaceContext);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [viewConfig, setViewConfig] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [deleteFilter, setDeleteFilter] = useState(""); // "", "active", "deleted"


  const fetchDeployments = async () => {
    try {
      await DefaultService.apiIntegrationKubernetesReleaseGet({
        name: null,
        namespace: selectedNamespace,
      })
        .then((response: any) => {
          if (response.status === "success") {
            setDeployments(response.data || []);
          } else {
          }
        })
        .catch((err: any) => {
        });
    } catch (err: any) {
    } finally {
    }
  };

  useEffect(() => {
    console.log({selectedNamespace})
    if(!selectedNamespace)return
    fetchDeployments();
  }, [selectedNamespace]);

  const filteredDeployments = deployments.filter((item) => {
    // Filter by delete status
    if (deleteFilter === "active") {
      return item.hard_delete === false && item.soft_delete === false;
    }
    if (deleteFilter === "inactive") {
      return item.soft_delete === true && item.hard_delete === false;
    }
    if (deleteFilter === "delete") {
      return item.hard_delete === true;
    }
    // Default: show all
    return true;
  }).filter((item) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const sourceControl = (item.code_source_control_name || "").toLowerCase();
    const deploymentName = (item.deployment_name || "").toLowerCase();
    const labels = Object.entries(item.labels || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(" ")
      .toLowerCase();

    return (
      sourceControl.includes(searchLower) ||
      deploymentName.includes(searchLower) ||
      labels.includes(searchLower)
    );
  });


  return (
    <div title="Release Configurations" className="p-4 w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <span className="flex items-center gap-2">
              <FileCog className="h-4 w-4" /> Release Configurations
            </span>
          }
          shortDescription="Define the configuration needed to deploy your service, including metadata for traceability."
          description="Define the parameters and metadata required for this deployment. This may include the deployment name, container image, pull request URL, Jira ticket, and other contextual information used to identify and track this release."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center justify-between">
                <h2>Active Release Configs</h2>
                <div className=" flex items-center gap-2">
                  <NamespaceSelector />
                  <Button
                    onClick={() => {
                      setAddDialogOpen(true);
                    }}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileCog className="h-4 w-4" />
                    Add Release Config
                  </Button>
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Configure which release environments are available for
              deployments.
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none p-0">
            <ReleaseConfigFilters
              search={search}
              onSearchChange={setSearch}
              deleteFilter={deleteFilter}
              onDeleteFilterChange={setDeleteFilter}
            />
            <ResourceTable
              columns={columns}
              data={filteredDeployments.map((item) => ({
                ...item,
                fullData: item,
                status: item.hard_delete?"deleted":item.soft_delete ? "inactive" : "active",
                labels: Object.entries(item.labels || {}).map(
                  ([key, value]) => `${key}: ${value}`
                ),
                showDelete: !item.hard_delete,
                showEdit: !item.hard_delete,
                showClone: !item.hard_delete,
                showUndo: item.hard_delete
              }))}
              onEdit={(row) => {
                setEditingConfig(row.fullData);
                setAddDialogOpen(true);
              }}
              onDelete={(row) => {
                const data = row.fullData;
                DefaultService.apiIntegrationKubernetesReleaseDelete({
                  namespace: row.fullData.namespace,
                  name: row.fullData.deployment_name,
                })
                  .then((res: any) => {
                    if (res.status === "success") {
                      toast.success("Release config delete successfully!");
                      fetchDeployments();
                    } else {
                      toast.error("Error creating deployment:", res.message);
                    }
                  })
                  .catch((err) => {
                    toast.error(err.message);
                  });
              }}
              onViewDetails={(row) => {
                setViewConfig(row.fullData);
              }}
              onClone={(row)=>{
                DefaultService.apiIntegrationKubernetesReleasePost({
                  requestBody: {
                    ...row.fullData,
                    id: null,
                    deployment_name: row.fullData.deployment_name + "-clone",
                    soft_delete: false,
                    hard_delete: false,
                  },
                })
                  .then((response) => {
                    if (response.status === "success") {
                      toast.success("Release config cloned successfully!");
                      fetchDeployments();
                    } else {
                      // TODO: Show error to user
                      toast.error(
                        "Error Cloning deployment:",
                        response.message
                      );
                    }
                  })
                  .catch((error) => {
                    // TODO: Show error to user
                    toast.error("Error Cloning form:", error);
                  });
              }}
              onUndo={(row)=>{
                DefaultService.apiIntegrationKubernetesReleasePut({
                  requestBody: {
                    ...row.fullData,
                    hard_delete:false,
                  },
                })
                  .then((response) => {
                    if (response.status === "success") {
                      toast.success("Release config restored successfully!");
                      fetchDeployments()
                    } else {
                      // TODO: Show error to user
                      toast.error(
                        "Error Restoring deployment:",
                        response.message
                      );
                    }
                  })
                  .catch((error) => {
                    // TODO: Show error to user
                    toast.error("Error restoring form:", error);
                  });
              }}
              className="mt-4"
            />
          </CardContent>
        </Card>
        {/* Full window modal for viewing config details */}
        <ReleaseConfigDetails
          open={!!viewConfig}
          onClose={() => setViewConfig(null)}
          config={viewConfig}
        />
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-none w-screen h-screen flex flex-col">
            <DialogHeader className="py-4 px-6 border-b">
              <DialogTitle className="flex gap-2 items-center">
                <FileCog className="w-4 h-4" />{" "}
                {editingConfig && editingConfig.name
                  ? "Edit Release Config"
                  : "Add Release Config"}
              </DialogTitle>
              <DialogDescription>
                Configure a new release environment and deployment settings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <ReleaseConfigForm
                namespace={selectedNamespace}
                onSuccess={() => {
                  setAddDialogOpen(false);
                  setEditingConfig({});
                  fetchDeployments();
                  // Refresh configs if needed
                }}
                initialValues={editingConfig}
                isEdit={!!editingConfig && !!editingConfig.deployment_name}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ReleaseConfigPage;

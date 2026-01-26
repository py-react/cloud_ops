import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileCog, SlidersHorizontal, RefreshCw, Plus, FileText, CheckCircle, XCircle, Trash2, Package, GitBranch } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { ReleaseConfigFilters } from "@/components/ciCd/releaseConfig/common/ReleaseConfigFilters";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import useNavigate from "@/libs/navigate";
import { FormWizard } from "@/components/wizard/form-wizard";
import { releaseFormSchema } from "@/components/ciCd/releaseConfig/forms/components/formUtils";
import { Settings } from "lucide-react";

// Simplified step component
import SimpleReleaseConfig from "@/components/ciCd/releaseConfig/forms/SimpleReleaseConfig";

const columns = [
  { header: "Release Config Name", accessor: "deployment_name" },
  { header: "Type", accessor: "type" },
  { header: "Source Control", accessor: "code_source_control_name" },
  { header: "Branch", accessor: "source_control_branch" },
  { header: "Derived Deployment", accessor: "derived_deployment_name" },
  { header: "Status", accessor: "status" },
];

const ReleaseConfigPage = () => {
  const navigate = useNavigate();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [search, setSearch] = useState("");
  const [deleteFilter, setDeleteFilter] = useState(""); // "", "active", "inactive", "delete"
  const [currentStep, setCurrentStep] = useState("essential");

  const INITIAL_VALUES = React.useMemo(() => ({
    deployment_name: '',
    namespace: selectedNamespace || 'default',
    type: '',
    required_source_control: false,
    code_source_control_name: null,
    source_control_branch: null,
    derived_deployment_id: null,
  }), [selectedNamespace]);

  const sanitizeFormData = (data: any) => {
    if (!data || !data.deployment_name) return INITIAL_VALUES;

    const { soft_delete, hard_delete, deleted_at, id, ...cleanData } = data;

    return {
      ...INITIAL_VALUES,
      ...cleanData,
    };
  };

  const steps = [
    {
      id: "essential",
      label: "Release Configuration",
      icon: Settings,
      description: "Required config",
      longDescription: "Define the release configuration with source control and deployment references.",
      component: SimpleReleaseConfig,
    },
  ];

  const handleWizardSubmit = async (data: any) => {
    try {
      const isEdit = !!editingConfig?.deployment_name;

      // Prepare payload with required backend fields
      const payload = {
        ...data,
        id: isEdit ? editingConfig?.id : undefined,  // Include id for updates
        tag: data.tag || null,
        deployment_strategy_id: data.deployment_strategy_id || null,
        code_source_control_name: data.code_source_control_name || null,
        source_control_branch: data.source_control_branch || null,
      };

      console.log("Submitting payload:", payload);

      const response: any = isEdit
        ? await DefaultService.apiIntegrationKubernetesReleasePut({ requestBody: payload })
        : await DefaultService.apiIntegrationKubernetesReleasePost({ requestBody: payload });

      if (response.status === "success") {
        toast.success(isEdit ? "Release configuration updated!" : "Release configuration created!");
        fetchDeployments();
        setAddDialogOpen(false);
        setEditingConfig({});
      } else {
        toast.error(response.message || "Failed to save configuration");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      // Fetch all items (backend only excludes hard-deleted)
      const response: any = await DefaultService.apiIntegrationKubernetesReleaseGet({
        name: null,
        namespace: selectedNamespace,
      });
      if (response.status === "success") {
        setDeployments(response.data || []);
      } else {
        toast.error(response.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedNamespace) return;
    fetchDeployments();
  }, [selectedNamespace]);  // Only refetch when namespace changes

  const filteredDeployments = deployments
    .filter((item) => {
      // Always exclude hard-deleted items from all views
      if (item.hard_delete === true) {
        return false;
      }

      // Filter by delete status
      if (deleteFilter === "active") {
        return item.status === "active" && item.soft_delete === false;
      }
      if (deleteFilter === "inactive") {
        return item.status === "inactive" && item.soft_delete === false;
      }
      if (deleteFilter === "delete") {
        return item.soft_delete === true;
      }
      // No filter - show all (active, inactive, and soft-deleted)
      return true;
    })
    .filter((item) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const sourceControl = (item.code_source_control_name || "").toLowerCase();
      const deploymentName = (item.deployment_name || "").toLowerCase();

      return (
        sourceControl.includes(searchLower) ||
        deploymentName.includes(searchLower)
      );
    });

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
      {/* Page Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <FileCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Release Configurations</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                Define the parameters and metadata required for traceability across deployments in <span className="text-primary font-bold">{selectedNamespace}</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <NamespaceSelector />
          <Button variant="outline" onClick={fetchDeployments}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              setEditingConfig({});
              setAddDialogOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Config
          </Button>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
        <ResourceCard
          title="Total Configs"
          count={deployments.filter(d => !d.soft_delete).length}
          icon={<FileCog className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Active"
          count={deployments.filter(d => !d.soft_delete && d.status === 'active').length}
          icon={<CheckCircle className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Inactive"
          count={deployments.filter(d => !d.soft_delete && d.status === 'inactive').length}
          icon={<XCircle className="w-4 h-4" />}
          color="bg-amber-500"
          className="border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Deleted"
          count={deployments.filter(d => d.soft_delete).length}
          icon={<Trash2 className="w-4 h-4" />}
          color="bg-destructive"
          className="border-destructive/20 bg-destructive/5 shadow-none hover:border-destructive/30 transition-all"
          isLoading={loading}
        />
      </div>

      <div className="flex-1 min-h-0 mt-10">
        <ResourceTable
          title="Active Release Configs"
          description="Configure which release environments are available for deployments."
          icon={<SlidersHorizontal className="h-4 w-4" />}
          columns={columns}
          extraHeaderContent={
            <ReleaseConfigFilters
              search={search}
              onSearchChange={setSearch}
              deleteFilter={deleteFilter}
              onDeleteFilterChange={setDeleteFilter}
            />
          }
          data={filteredDeployments.map((item) => ({
            ...item,
            fullData: item,
            code_source_control_name: item.code_source_control_name || (item.required_source_control ? "Missing" : "N/A"),
            source_control_branch: item.source_control_branch || (item.required_source_control ? "Missing" : "N/A"),
            derived_deployment_name: item.derived_deployment_name || "N/A",
            status: item.soft_delete ? "deleted" : (item.status || "active"),
            showDelete: !item.hard_delete,
            showEdit: !item.hard_delete && !item.soft_delete,
            showClone: !item.hard_delete && !item.soft_delete,
            showUndo: item.soft_delete === true && !item.hard_delete,
            showPause: item.status === "active" && !item.soft_delete,  // Show pause for active items
            showPlay: item.status === "inactive" && !item.soft_delete,  // Show play for inactive items
          }))}
          onEdit={(row) => {
            setEditingConfig(row.fullData);
            setAddDialogOpen(true);
          }}
          onUndo={(row) => {
            // Restore soft-deleted item and set to active
            DefaultService.apiIntegrationKubernetesReleasePut({
              requestBody: {
                ...row.fullData,
                soft_delete: false,
                status: "active",
              },
            })
              .then((res: any) => {
                if (res.status === "success") {
                  toast.success("Release config restored and activated");
                  fetchDeployments();
                } else {
                  toast.error(res.message);
                }
              })
              .catch((err) => {
                toast.error(err.message);
              });
          }}
          onPause={(row) => {
            console.log("Pausing config:", row.fullData);
            if (!row.fullData.id) {
              toast.error("Error: Missing ID for toggle action");
              return;
            }
            // Toggle status to inactive
            DefaultService.apiIntegrationKubernetesReleasePut({
              requestBody: {
                ...row.fullData,
                status: "inactive",
              },
            })
              .then((res: any) => {
                if (res.status === "success") {
                  toast.success("Release config set to inactive");
                  fetchDeployments();
                } else {
                  toast.error(res.message);
                }
              })
              .catch((err) => {
                toast.error(err.message);
              });
          }}
          onPlay={(row) => {
            console.log("Starting config:", row.fullData);
            if (!row.fullData.id) {
              toast.error("Error: Missing ID for toggle action");
              return;
            }
            // Toggle status to active
            DefaultService.apiIntegrationKubernetesReleasePut({
              requestBody: {
                ...row.fullData,
                status: "active",
              },
            })
              .then((res: any) => {
                if (res.status === "success") {
                  toast.success("Release config set to active");
                  fetchDeployments();
                } else {
                  toast.error(res.message);
                }
              })
              .catch((err) => {
                toast.error(err.message);
              });
          }}
          onDelete={(row) => {
            const isSoftDeleted = row.fullData.soft_delete === true;

            // If already soft-deleted, confirm hard delete (irreversible)
            if (isSoftDeleted) {
              if (!window.confirm(
                "⚠️ WARNING: This will permanently delete this release config and cannot be undone.\n\n" +
                "Are you sure you want to proceed with permanent deletion?"
              )) {
                return; // User cancelled
              }

              // Perform hard delete via API (update hard_delete flag)
              DefaultService.apiIntegrationKubernetesReleasePut({
                requestBody: {
                  ...row.fullData,
                  hard_delete: true,
                },
              })
                .then((res: any) => {
                  if (res.status === "success") {
                    toast.success("Release config permanently deleted");
                    fetchDeployments();
                  } else {
                    toast.error(res.message);
                  }
                })
                .catch((err) => {
                  toast.error(err.message);
                });
            } else {
              // Perform soft delete (normal delete)
              DefaultService.apiIntegrationKubernetesReleaseDelete({
                namespace: row.fullData.namespace,
                name: row.fullData.deployment_name,
              })
                .then((res: any) => {
                  if (res.status === "success") {
                    toast.success("Release config deleted (can be restored)");
                    fetchDeployments();
                  } else {
                    toast.error(res.message);
                  }
                })
                .catch((err) => {
                  toast.error(err.message);
                });
            }
          }}
          onViewDetails={(row) => {
            navigate(
              `/settings/ci_cd/release_config/${row.fullData.namespace}/${row.fullData.deployment_name}`
            );
          }}
          onClone={(row) => {
            DefaultService.apiIntegrationKubernetesReleasePost({
              requestBody: {
                ...row.fullData,
                id: null,
                deployment_name: row.fullData.deployment_name + "-clone",
                soft_delete: false,
                hard_delete: false,
              },
            })
              .then((response: any) => {
                if (response.status === "success") {
                  toast.success("Release config cloned successfully!");
                  fetchDeployments();
                } else {
                  toast.error(response.message);
                }
              })
              .catch((error: any) => {
                toast.error("Error Cloning form:", error);
              });
          }}
        />
      </div>

      <FormWizard
        key={editingConfig?.id || "add"}
        name="release-config-wizard"
        isWizardOpen={addDialogOpen}
        setIsWizardOpen={setAddDialogOpen}
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        initialValues={sanitizeFormData(editingConfig)}
        schema={releaseFormSchema}
        onSubmit={handleWizardSubmit}
        heading={{
          primary: editingConfig?.deployment_name ? "Edit Release Config" : "Add Release Config",
          secondary: "Configure a new release environment and deployment settings.",
          icon: FileCog,
        }}
        submitLabel={editingConfig?.deployment_name ? "Save Changes" : "Create Release"}
      />
    </div>
  );
};

export default ReleaseConfigPage;

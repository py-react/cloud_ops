import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileCog, SlidersHorizontal, RefreshCw, Plus, FileText, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { ReleaseConfigFilters } from "@/components/ciCd/releaseConfig/common/ReleaseConfigFilters";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import useNavigate from "@/libs/navigate";
// Final cleanup of index.tsx - removing CreateRelease import
import { FormWizard } from "@/components/wizard/form-wizard";
import { releaseFormSchema, DeploymentFormData } from "@/components/ciCd/releaseConfig/forms/components/formUtils";
import { Settings, Container, Network, Tag, FileCode } from "lucide-react";

// Step components
import EssentialConfig from "@/components/ciCd/releaseConfig/forms/EssentialConfig";
import YamlReviewStep from "@/components/ciCd/releaseConfig/forms/YamlReviewStep";

const columns = [
  { header: "Deployment Name", accessor: "deployment_name" },
  { header: "Source Control", accessor: "code_source_control_name" },
  { header: "Labels", accessor: "labels" },
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

  const INITIAL_VALUES: DeploymentFormData = React.useMemo(() => ({
    deployment_name: '',
    namespace: selectedNamespace || 'default',
    type: 'web-app',
    tag: 'latest',
    code_source_control_name: '',
    deployment_strategy_id: 1, // Default strategy
    replicas: 1,
    containers: [{ name: '' }],
  }), [selectedNamespace]);

  const sanitizeFormData = (data: any): DeploymentFormData => {
    if (!data || !data.deployment_name) return INITIAL_VALUES;

    // Destructure to omit internal fields from form state
    const { soft_delete, hard_delete, deleted_at, id, ...cleanData } = data;

    return {
      ...INITIAL_VALUES,
      ...cleanData,
      containers: data.containers?.length
        ? data.containers.map((c: any) => ({ ...c, name: c.name || '' }))
        : [{ name: '' }],
      node_selector: data.node_selector || {},
      labels: data.labels || {},
      annotations: data.annotations || {},
      service_ports: data.service_ports || [],
    };
  };

  const steps = [
    {
      id: "essential",
      label: "Essential Details",
      icon: Settings,
      description: "Required config",
      longDescription: "Fill in the mandatory fields to define your deployment's identity, image, and pipeline strategy.",
      component: EssentialConfig,
    },
    {
      id: "yaml",
      label: "Advanced YAML",
      icon: FileCode,
      description: "Optional settings",
      longDescription: "Review the generated manifest and add optional configurations like replicas, ports, and metadata labels.",
      component: YamlReviewStep,
    },
  ];

  const handleWizardSubmit = async (data: DeploymentFormData) => {
    try {
      const isEdit = !!editingConfig?.deployment_name;
      const response: any = isEdit
        ? await DefaultService.apiIntegrationKubernetesReleasePut({ requestBody: data })
        : await DefaultService.apiIntegrationKubernetesReleasePost({ requestBody: data });

      if (response.status === "success") {
        toast.success(isEdit ? "Release configuration updated!" : "Release configuration created!");
        fetchDeployments();
        setAddDialogOpen(false);
        setEditingConfig({});
      } else {
        toast.error(response.message || "Failed to save configuration");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    }
  };

  const fetchDeployments = async () => {
    setLoading(true);
    try {
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
  }, [selectedNamespace]);

  const filteredDeployments = deployments
    .filter((item) => {
      if (deleteFilter === "active") {
        return item.hard_delete === false && item.soft_delete === false;
      }
      if (deleteFilter === "inactive") {
        return item.soft_delete === true && item.hard_delete === false;
      }
      if (deleteFilter === "delete") {
        return item.hard_delete === true;
      }
      return true;
    })
    .filter((item) => {
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
          count={deployments.length}
          icon={<FileCog className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Active"
          count={deployments.filter(d => !d.hard_delete && !d.soft_delete).length}
          icon={<CheckCircle className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Inactive"
          count={deployments.filter(d => !d.hard_delete && d.soft_delete).length}
          icon={<XCircle className="w-4 h-4" />}
          color="bg-amber-500"
          className="border-amber-500/20 bg-amber-500/5 shadow-none hover:border-amber-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Deleted"
          count={deployments.filter(d => d.hard_delete).length}
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
            status: item.hard_delete
              ? "deleted"
              : item.soft_delete
                ? "inactive"
                : "active",
            labels: Object.entries(item.labels || {}).map(
              ([key, value]) => `${key}: ${value}`
            ),
            showDelete: !item.hard_delete,
            showEdit: !item.hard_delete,
            showClone: !item.hard_delete,
            showUndo: item.hard_delete,
          }))}
          onEdit={(row) => {
            setEditingConfig(row.fullData);
            setAddDialogOpen(true);
          }}
          onDelete={(row) => {
            DefaultService.apiIntegrationKubernetesReleaseDelete({
              namespace: row.fullData.namespace,
              name: row.fullData.deployment_name,
            })
              .then((res: any) => {
                if (res.status === "success") {
                  toast.success("Release config deleted successfully!");
                  fetchDeployments();
                } else {
                  toast.error(res.message);
                }
              })
              .catch((err) => {
                toast.error(err.message);
              });
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
          onUndo={(row) => {
            DefaultService.apiIntegrationKubernetesReleasePut({
              requestBody: {
                ...row.fullData,
                hard_delete: false,
              },
            })
              .then((response: any) => {
                if (response.status === "success") {
                  toast.success("Release config restored successfully!");
                  fetchDeployments();
                } else {
                  toast.error(response.message);
                }
              })
              .catch((error: any) => {
                toast.error("Error restoring form:", error);
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

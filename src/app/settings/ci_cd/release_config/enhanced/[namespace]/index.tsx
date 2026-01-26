import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileCog,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Layers,
  Container,
  Database,
  Cpu,
  Activity,
  GitBranch,
  Eye
} from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { ReleaseConfigFilters } from "@/components/ciCd/releaseConfig/common/ReleaseConfigFilters";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import useNavigate from "@/libs/navigate";
import { FormWizard } from "@/components/wizard/form-wizard";
import { Settings, Tag, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-shadcn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Enhanced step components
import EssentialConfig from "@/components/ciCd/releaseConfig/forms/EssentialConfig";
import ModuleSelectionStep from "@/components/ciCd/releaseConfig/forms/ModuleSelectionStep";
import CompositionPreviewStep from "@/components/ciCd/releaseConfig/forms/CompositionPreviewStep";
import YamlReviewStep from "@/components/ciCd/releaseConfig/forms/YamlReviewStep";

interface ComposableDeploymentFormData {
  deployment_name: string;
  namespace: string;
  type: string;
  tag: string;
  code_source_control_name: string;
  deployment_strategy_id: number;
  replicas: number;

  // Composable modules
  container_profile_ids: string[];
  volume_profile_ids: string[];
  scheduling_profile_ids: string[];
  resource_profile_ids: string[];
  probe_profile_ids: string[];
  env_profile_ids: string[];
  lifecycle_profile_ids: string[];

  // Legacy fields for compatibility
  labels: Record<string, string>;
  annotations: Record<string, string>;
  service_ports: any[];
}

const columns = [
  { header: "Deployment Name", accessor: "deployment_name" },
  { header: "Source Control", accessor: "code_source_control_name" },
  { header: "Labels", accessor: "labels" },
  { header: "Status", accessor: "status" },
  { header: "Modules", accessor: "module_count", type: "badge" },
];

const EnhancedReleaseConfigPage = () => {
  const navigate = useNavigate();
  const { selectedNamespace } = useContext(NamespaceContext);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [search, setSearch] = useState("");
  const [deleteFilter, setDeleteFilter] = useState("");
  const [currentStep, setCurrentStep] = useState("essential");
  const [activeTab, setActiveTab] = useState("list");

  const INITIAL_VALUES: ComposableDeploymentFormData = React.useMemo(() => ({
    deployment_name: '',
    namespace: selectedNamespace || 'default',
    type: 'web-app',
    tag: 'latest',
    code_source_control_name: '',
    deployment_strategy_id: 1,
    replicas: 1,

    // Composable modules
    container_profile_ids: [],
    volume_profile_ids: [],
    scheduling_profile_ids: [],
    resource_profile_ids: [],
    probe_profile_ids: [],
    env_profile_ids: [],
    lifecycle_profile_ids: [],

    // Legacy compatibility
    labels: {},
    annotations: {},
    service_ports: [],
  }), [selectedNamespace]);

  const sanitizeFormData = (data: any): ComposableDeploymentFormData => {
    if (!data || !data.deployment_name) return INITIAL_VALUES;

    const { soft_delete, hard_delete, deleted_at, id, ...cleanData } = data;

    return {
      ...INITIAL_VALUES,
      ...cleanData,
      labels: data.labels || {},
      annotations: data.annotations || {},
      service_ports: data.service_ports || [],
      // Ensure module IDs are arrays
      container_profile_ids: data.container_profile_ids || [],
      volume_profile_ids: data.volume_profile_ids || [],
      scheduling_profile_ids: data.scheduling_profile_ids || [],
      resource_profile_ids: data.resource_profile_ids || [],
      probe_profile_ids: data.probe_profile_ids || [],
      env_profile_ids: data.env_profile_ids || [],
      lifecycle_profile_ids: data.lifecycle_profile_ids || [],
    };
  };

  const steps = [
    {
      id: "essential",
      label: "Essential Details",
      icon: Settings,
      description: "Required config",
      longDescription: "Fill in mandatory fields to define your deployment's identity, image, and pipeline strategy.",
      component: EssentialConfig,
    },
    {
      id: "modules",
      label: "Select Modules",
      icon: Layers,
      description: "Compose modules",
      longDescription: "Select and configure reusable modules for containers, volumes, resources, and more.",
      component: ModuleSelectionStep,
    },
    {
      id: "preview",
      label: "Preview Composition",
      icon: Eye,
      description: "Review result",
      longDescription: "Preview how your selected modules will compose into the final Kubernetes manifest.",
      component: CompositionPreviewStep,
    },
    {
      id: "yaml",
      label: "Advanced YAML",
      icon: FileCode,
      description: "Final review",
      longDescription: "Review the final composed manifest and make any last-minute adjustments.",
      component: YamlReviewStep,
    },
  ];

  const handleWizardSubmit = async (data: ComposableDeploymentFormData) => {
    try {
      const isEdit = !!editingConfig?.deployment_name;

      // Calculate module count for display
      const moduleCount = [
        data.container_profile_ids,
        data.volume_profile_ids,
        data.scheduling_profile_ids,
        data.resource_profile_ids,
        data.probe_profile_ids,
        data.env_profile_ids,
        data.lifecycle_profile_ids
      ].reduce((sum, ids) => sum + (ids?.length || 0), 0);

      const enhancedData = {
        ...data,
        module_count: moduleCount,
        is_composable: true
      };

      const response: any = isEdit
        ? await DefaultService.apiIntegrationKubernetesReleasePut({ requestBody: enhancedData })
        : await DefaultService.apiIntegrationKubernetesReleasePost({ requestBody: enhancedData });

      if (response.success) {
        toast.success(isEdit ? "Release configuration updated!" : "Release configuration created!");
        setAddDialogOpen(false);
        fetchDeployments();
      } else {
        toast.error(response.message || "Failed to save configuration");
      }
    } catch (error) {
      toast.error("Error saving configuration");
    }
  };

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const response = await DefaultService.apiIntegrationKubernetesReleaseGet({
        namespace: selectedNamespace
      });
      setDeployments(response || []);
    } catch (error) {
      toast.error("Failed to fetch release configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeployments(); }, [selectedNamespace]);

  const handleDeploy = async (deploymentName: string) => {
    try {
      const response = await DefaultService.apiIntegrationKubernetesReleaseRunPost({
        deployment_name: deploymentName,
        namespace: selectedNamespace,
        // Runtime overrides can be added here
        runtime_overrides: {
          // image: "specific-image:tag", // Example runtime override
        }
      });

      if (response.success) {
        toast.success("Deployment initiated successfully!");
        navigate(`/${selectedNamespace}/deployments`);
      } else {
        toast.error(response.message || "Failed to initiate deployment");
      }
    } catch (error) {
      toast.error("Error initiating deployment");
    }
  };

  const filteredDeployments = deployments
    .filter(d => {
      const deploymentName = (d.deployment_name || "").toLowerCase();
      const searchLower = search.toLowerCase();
      return (
        deploymentName.includes(searchLower) ||
        d.code_source_control_name?.toLowerCase().includes(searchLower)
      );
    })
    .filter(d => {
      if (deleteFilter === "active") return !d.hard_delete && !d.soft_delete;
      if (deleteFilter === "inactive") return !d.hard_delete && d.soft_delete;
      if (deleteFilter === "delete") return d.hard_delete;
      return true;
    })
    .map(d => ({
      ...d,
      module_count: d.module_count || 0,
      is_composable: d.is_composable || false
    }));

  const getModuleCounts = () => {
    const active = filteredDeployments.filter(d => !d.hard_delete && !d.soft_delete).length;
    const inactive = filteredDeployments.filter(d => !d.hard_delete && d.soft_delete).length;
    const deleted = filteredDeployments.filter(d => d.hard_delete).length;
    return { active, inactive, deleted, total: filteredDeployments.length };
  };

  const moduleStats = getModuleCounts();

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden">
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Enhanced Release Config</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                Configure composable deployment environments with modular Kubernetes resources in <span className="text-primary font-bold">{selectedNamespace}</span>.
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
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Enhanced Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="volumes">Volumes</TabsTrigger>
          <TabsTrigger value="modules">All Modules</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Release Configurations</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{moduleStats.total} total</Badge>
                  <Badge variant="default">{moduleStats.active} active</Badge>
                  <Badge variant="secondary">{moduleStats.inactive} inactive</Badge>
                  <Badge variant="destructive">{moduleStats.deleted} deleted</Badge>
                </div>
              </div>
              <ReleaseConfigFilters
                search={search}
                setSearch={setSearch}
                deleteFilter={deleteFilter}
                setDeleteFilter={setDeleteFilter}
              />
            </div>

            <ResourceTable
              columns={columns}
              data={filteredDeployments}
              loading={loading}
              onRowAction={(action, row) => {
                if (action === 'edit') {
                  setEditingConfig(row);
                  setAddDialogOpen(true);
                } else if (action === 'deploy') {
                  handleDeploy(row.deployment_name);
                } else if (action === 'delete') {
                  // Handle delete
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="containers" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Container Profiles</CardTitle>
                <Container className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Available profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Use</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Deployed configurations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Updated this week</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volumes" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Profiles</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">Persistent volumes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ConfigMaps</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Configuration files</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42GB</div>
                <p className="text-xs text-muted-foreground">Total allocated</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Resource profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Probes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Health checks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduling</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Node affinity rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Environment</CardTitle>
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6</div>
                <p className="text-xs text-muted-foreground">Environment configs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compose" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Visual Composer</h3>
              <p className="text-muted-foreground max-w-md">
                Drag and drop interface for visual composition of Kubernetes modules.
                Coming soon in the next release.
              </p>
              <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                Use Wizard Composer
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {editingConfig?.deployment_name ? "Edit Enhanced Release Config" : "Create Enhanced Release Config"}
            </DialogTitle>
          </DialogHeader>

          <FormWizard
            name="enhanced-release-config"
            isWizardOpen={addDialogOpen}
            setIsWizardOpen={setAddDialogOpen}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            steps={steps}
            initialData={editingConfig ? sanitizeFormData(editingConfig) : INITIAL_VALUES}
            onSubmit={handleWizardSubmit}
            submitLabel={editingConfig?.deployment_name ? "Update Configuration" : "Create Configuration"}
            submitIcon={FileCog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedReleaseConfigPage;
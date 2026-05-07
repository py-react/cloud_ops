import React, { useMemo } from "react";
import { Activity, Rocket, Link, Hash, Tag, Globe, Github } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { DefaultService } from "@/gingerJs_api_client/services/DefaultService";
import type { DeploymentRunType } from "@/gingerJs_api_client/models/DeploymentRunType";
import { toast } from "sonner";
import FormWizard from "@/components/wizard/form-wizard";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipWrapper } from "@/components/ui/tooltip";

// Types
export interface ServicePort {
  port: number;
  protocol: string;
  target_port: number;
}

export interface ContainerPort {
  port: number;
  protocol: string;
  target_port: number;
}

export interface Container {
  env: Record<string, string> | null;
  args: string[] | null;
  name: string;
  ports: ContainerPort[];
  command: string[] | null;
  resources: any | null;
}

export interface ReleaseConfigData {
  deployment_name: string;
  type: string;
  code_source_control_name: string;
  replicas: number;
  service_ports: ServicePort[];
  annotations: Record<string, string>;
  deleted_at: string;
  namespace: string;
  id: number;
  tag: string;
  containers: Container[];
  labels: Record<string, string>;
  soft_delete: boolean;
  hard_delete: boolean;
  status: string;
  kind?: string;
  category?: string;
  deployment_strategy_id?: number;
  http_route_id?: number;
  source_control_branch?: string;
}

export interface ReleaseRunData {
  pr_url: string;
  images: Record<string, string>;
  status: string;
  jira: string;
  id: number;
  deployment_config_id: number;
  created_at?: string
}

interface ReleaseRunProps {
  deployment_config: ReleaseConfigData;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: Partial<ReleaseRunFormValues>;
}

const releaseRunSchema = z.object({
  pr_url: z.string().optional(),
  jira: z.string().optional(),
  images_repo: z.record(z.string().min(1, "Repository is required")),
  images_tag: z.record(z.string().min(1, "Tag is required")),
  // Package specific
  release_notes: z.string().optional(),
  is_public: z.boolean(),
});

type ReleaseRunFormValues = z.infer<typeof releaseRunSchema>;

export const ReleaseRun = ({
  deployment_config,
  open,
  onClose,
  onSuccess,
  defaultValues
}: ReleaseRunProps) => {
  const [activeStep, setActiveStep] = React.useState("metadata");

  const initialValues = useMemo(() => {
    const defaults = {
      pr_url: "",
      jira: "",
      images_repo: deployment_config?.category === 'package' 
        ? { main: "" }
        : (deployment_config?.containers || []).reduce((acc: any, c) => {
            acc[c.name] = "";
            return acc;
          }, {}),
      images_tag: deployment_config?.category === 'package' 
        ? { main: "" }
        : (deployment_config?.containers || []).reduce((acc: any, c) => {
            acc[c.name] = "";
            return acc;
          }, {}),
      version: "",
      release_notes: "",
      is_public: true,
    };

    if (defaultValues) {
      return {
        ...defaults,
        ...defaultValues,
      };
    }
    return defaults;
  }, [deployment_config, defaultValues]);

  const [builds, setBuilds] = React.useState<any[]>([]);
  const [loadingBuilds, setLoadingBuilds] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (open && deployment_config.code_source_control_name) {
      const fetchBuilds = async () => {
        setLoadingBuilds(true);
        const repo = deployment_config.code_source_control_name;
        const branch = deployment_config.source_control_branch || 'main';
        try {
          const res = await fetch(`/api/integration/github/builds?repo_name=${repo}&branch_name=${branch}`);
          const data = await res.json();
          setBuilds((data || []).filter((b: any) => b.status === 'success'));
        } catch (e) {
          console.error("[ReleaseRun] Failed to fetch builds", e);
        } finally {
          setLoadingBuilds(false);
        }
      };
      fetchBuilds();
    }
  }, [open, deployment_config]);

  const onSubmit = async (values: ReleaseRunFormValues) => {
    if (deployment_config.status !== "active") {
      window.alert(`CRITICAL: This configuration is currently ${deployment_config.status}. 

You can only run releases for 'active' configurations. Please activate it first.`);
      onClose(false);
      return;
    }

    try {
      // Merge images_repo and images_tag into a single images object for the backend
      const images: Record<string, string> = {};
      Object.keys(values.images_repo).forEach(key => {
        if (values.images_repo[key] && values.images_tag[key]) {
          images[key] = `${values.images_repo[key]}:${values.images_tag[key]}`;
        }
      });

      const payload: DeploymentRunType = {
        ...values,
        images,
        deployment_config_id: deployment_config.id,
      };
      await DefaultService.apiIntegrationKubernetesReleaseRunPost({
        requestBody: payload,
      });
      toast.success(deployment_config.category === 'package' ? "Package release triggered!" : "Deployment triggered!");
      onSuccess()
      onClose(false);
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to trigger release.";
      toast.error(errorMsg);
    }
  };

  const steps = useMemo(() => [
    {
      id: "metadata",
      label: "Metadata",
      description: "Optional references",
      longDescription: "Add links to Pull Requests and Jira tickets for tracking.",
      component: ({ control }: any) => (
        <div className="space-y-4">
          <FormField
            control={control}
            name="pr_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Link className="h-3 w-3" /> PR URL
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/.../pull/123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="jira"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Jira Ticket
                </FormLabel>
                <FormControl>
                  <Input placeholder="OPS-1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: "versioning",
      label: deployment_config.category === 'package' ? "Release Details" : "Deployment Specs",
      description: deployment_config.category === 'package' ? "Version and Image" : "Container versions",
      longDescription: deployment_config.category === 'package' 
        ? "Specify the version tag and the PR image that contains your build artifacts."
        : "Specify the image name and tag for each container in this release.",
      component: ({ control, setValue }: any) => (
        <div className="space-y-6">
          {deployment_config.category === 'package' && (
            <div className="space-y-4 pb-4 border-b">
              <FormField
                control={control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" /> Public Release
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="release_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground/70">
                      Release Notes
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Describe changes in this release..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Source Build Section */}
          {deployment_config.code_source_control_name && (
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                  <Github className="h-4 w-4" /> Source Build Artifacts
                </h4>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                   {deployment_config.source_control_branch || 'main'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase text-blue-600/70">Select Recent Build</FormLabel>
                <Select 
                  key={builds.length}
                  value={selectedImage}
                  onValueChange={(val) => {
                    setSelectedImage(val);
                    const build = builds.find(b => b.image_name === val);
                    if (build && setValue) {
                      const containers = deployment_config.containers || [];
                      // Parse image name: registry/repo:tag
                      const lastColonIndex = build.image_name.lastIndexOf(':');
                      if (lastColonIndex !== -1) {
                        const repo = build.image_name.substring(0, lastColonIndex);
                        const tag = build.image_name.substring(lastColonIndex + 1);
                        
                        if (deployment_config.category === 'package') {
                          setValue('images_repo.main', repo);
                          setValue('images_tag.main', tag);
                        } else {
                          containers.forEach(c => {
                             setValue(`images_repo.${c.name}`, repo);
                             setValue(`images_tag.${c.name}`, tag);
                          });
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={loadingBuilds ? "Loading builds..." : "Choose an artifact..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {builds.map((build) => (
                      <SelectItem key={build.id} value={build.image_name}>
                        {build.image_name?.split('/').pop()}
                      </SelectItem>
                    ))}
                    {builds.length === 0 && !loadingBuilds && (
                      <div className="p-4 text-center text-xs text-muted-foreground">No builds found for this branch</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Image Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                {deployment_config.category === 'package' ? "Source Build Image" : "Container Images"}
              </h4>
              {deployment_config.code_source_control_name && (
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-dashed">
                  Managed by Source
                </Badge>
              )}
            </div>
            
            {!deployment_config.code_source_control_name ? (
              deployment_config.category === 'package' ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="images_repo.main"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Repository</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. library-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="images_tag.main"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. pr-123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                (deployment_config?.containers || []).map((container) => (
                  <div key={container.name} className="space-y-2 p-3 rounded-lg border bg-muted/10">
                     <FormLabel className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit mb-2">
                        {container.name}
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name={`images_repo.${container.name}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Repository (e.g. nginx)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`images_tag.${container.name}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Tag (e.g. 1.21)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                  </div>
                ))
              )
            ) : (
              <div className="p-4 border rounded-lg bg-muted/5 border-dashed text-center">
                 <p className="text-xs text-muted-foreground">
                   Images are automatically derived from the selected source build above.
                 </p>
              </div>
            )}
          </div>
        </div>
      )
    }
  ], [deployment_config, builds, loadingBuilds]);

  // Insert Configuration step at the beginning if service_id exists (indicates derived service capability)

  return (
    <FormWizard
      name="release-run-wizard"
      isWizardOpen={open}
      setIsWizardOpen={onClose}
      currentStep={activeStep}
      setCurrentStep={setActiveStep}
      steps={steps}
      schema={releaseRunSchema}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={deployment_config?.category === 'package' ? "Publish Release" : "Run Release"}
      submitIcon={Rocket}
      heading={{
        primary: deployment_config?.category === 'package' ? "Publish New Library Release" : "Run New Deployment Release",
        secondary: deployment_config?.category === 'package' 
          ? `Publish a new version for ${deployment_config?.deployment_name}`
          : `Trigger a fresh deployment for ${deployment_config?.deployment_name}`,
        icon: deployment_config?.category === 'package' ? Tag : Activity,
      }}
    />
  );
};

import React, { useMemo } from "react";
import { Activity, Rocket, Link, Hash, Tag, Globe } from "lucide-react";
import { z } from "zod";
import { DefaultService } from "@/gingerJs_api_client/services/DefaultService";
import type { DeploymentRunType } from "@/gingerJs_api_client/models/DeploymentRunType";
import { toast } from "sonner";
import FormWizard from "@/components/wizard/form-wizard";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
  images: z.record(z.string().min(1, "Image name is required")),
  apply_derived_service: z.boolean(),
  deployment_strategy_id: z.number().optional(),
  http_route_id: z.number().optional(),
  apply_derived_httproute: z.boolean(),
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
      apply_derived_service: false,
      apply_derived_httproute: false,
      deployment_strategy_id: deployment_config?.deployment_strategy_id || undefined,
      http_route_id: deployment_config?.http_route_id || undefined,
      images: deployment_config?.category === 'package' 
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
        images: {
          ...defaults.images,
          ...(defaultValues.images || {})
        }
      };
    }
    return defaults;
  }, [deployment_config, defaultValues]);

  const onSubmit = async (values: ReleaseRunFormValues) => {
    if (deployment_config.status !== "active") {
      window.alert(`CRITICAL: This configuration is currently ${deployment_config.status}. 

You can only run releases for 'active' configurations. Please activate it first.`);
      onClose(false);
      return;
    }

    try {
      const payload: DeploymentRunType = {
        ...values,
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
      component: ({ control }: any) => (
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

          {/* Image Selection Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {deployment_config.category === 'package' ? "Source Build Image" : "Container Images"}
            </h4>
            
            {deployment_config.category === 'package' ? (
              <FormField
                control={control}
                name="images.main"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Artifact Image Tag (from PR)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. library-name:pr-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              (deployment_config?.containers || []).map((container) => (
                <FormField
                  key={container.name}
                  control={control}
                  name={`images.${container.name}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit">
                        {container.name}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. nginx:1.21-alpine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))
            )}
          </div>
        </div>
      )
    }
  ], [deployment_config]);

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

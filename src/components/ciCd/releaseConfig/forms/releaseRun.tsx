import React, { useMemo } from "react";
import { Activity, Rocket, Link, Hash } from "lucide-react";
import { z } from "zod";
import { DefaultService } from "@/gingerJs_api_client/services/DefaultService";
import type { DeploymentRunType } from "@/gingerJs_api_client/models/DeploymentRunType";
import { toast } from "sonner";
import FormWizard from "@/components/wizard/form-wizard";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
  onSuccess: () => void
}

const releaseRunSchema = z.object({
  pr_url: z.string().optional(),
  jira: z.string().optional(),
  images: z.record(z.string().min(1, "Image name is required")),
});

type ReleaseRunFormValues = z.infer<typeof releaseRunSchema>;

export const ReleaseRun = ({
  deployment_config,
  open,
  onClose,
  onSuccess
}: ReleaseRunProps) => {
  const [activeStep, setActiveStep] = React.useState("metadata");

  const initialValues = useMemo(() => ({
    pr_url: "",
    jira: "",
    images: (deployment_config?.containers || []).reduce((acc: any, c) => {
      acc[c.name] = "";
      return acc;
    }, {}),
  }), [deployment_config]);

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
      toast.success("Release run triggered successfully.")
      onSuccess()
      onClose(false);
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to trigger release run.";
      window.alert(`Release Failed: ${errorMsg}`);
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
      id: "images",
      label: "Deployment Images",
      description: "Container versions",
      longDescription: "Specify the image name and tag for each container in this release.",
      component: ({ control }: any) => (
        <div className="space-y-6">
          {(deployment_config?.containers || []).map((container) => (
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
          ))}
        </div>
      )
    }
  ], [deployment_config]);

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
      submitLabel="Run Release"
      submitIcon={Rocket}
      heading={{
        primary: "Run New Release",
        secondary: `Trigger a fresh deployment for ${deployment_config?.deployment_name}`,
        icon: Activity,
      }}
    />
  );
};

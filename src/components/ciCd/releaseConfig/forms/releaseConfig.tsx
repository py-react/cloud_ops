import React, { useState } from "react";
import { Activity } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { DefaultService } from "@/gingerJs_api_client/services/DefaultService";
import type { DeploymentRunType } from "@/gingerJs_api_client/models/DeploymentRunType";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  deployment_strategy_id: number;
  containers: Container[];
  labels: Record<string, string>;
  soft_delete: boolean;
  hard_delete: boolean;
}

export interface ReleaseRunData {
  pr_url: string;
  image_name: string;
  status: string;
  jira: string;
  id: number;
  deployment_config_id: number;
  created_at?: string
}

interface ReleaseRunProps {
  deployment_config_id: number;
  open: boolean;
  onClose: (open: boolean) => void;
  onSuccess:()=>void
}

const releaseRunSchema = z.object({
  pr_url: z.string().optional(),
  jira: z.string().optional(),
  image_name: z.string().min(1, "Image name is required"),
});

type ReleaseRunFormValues = z.infer<typeof releaseRunSchema>;

export const ReleaseRun = ({
  deployment_config_id,
  open,
  onClose,
  onSuccess
}: ReleaseRunProps) => {
  const form = useForm<ReleaseRunFormValues>({
    resolver: zodResolver(releaseRunSchema),
    defaultValues: {
      pr_url: "",
      jira: "",
      image_name: "",
    },
  });

  const onSubmit = async (values: ReleaseRunFormValues) => {
    try {
      const payload: DeploymentRunType = {
        ...values,
        deployment_config_id: deployment_config_id,
      };
      await DefaultService.apiIntegrationKubernetesReleaseRunPost({
        requestBody: payload,
      });
      toast.success("Release run triggered successfully.")
      form.reset();
      onSuccess()
    } catch (e: any) {
      toast.success(e?.message || "Failed to trigger release run.")
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0">
        {/* Release Run Form */}
        <div className="border-b border-slate-200">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex flex-row items-center gap-2 p-6">
            <div className="flex items-center space-x-3 gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Run New Release
            </div>
          </DialogTitle>
        </div>
        <div className="px-6 max-w-lg">
          <Form {...form}>
            <form
              id="ReleaseRun"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="pr_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PR URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PR URL (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Jira (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. nginx:latest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="px-6 pb-6 pt-2">
          <Button
            form="ReleaseRun"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Running..." : "Run Release"}
          </Button>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

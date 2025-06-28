import React, { useState } from "react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { DefaultService } from "@/gingerJs_api_client";

export interface RunsStepProps {
  config: any;
}

export const RunsStep = ({ config }: RunsStepProps) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [showRunSheet, setShowRunSheet] = useState(false);

  const form = useForm<{
    pr_url?: string;
    jira?: string;
    image_name: string;
    status?: string;
  }>({
    defaultValues: {
      pr_url: "",
      jira: "",
      image_name: "",
      status: "pending",
    },
  });
  React.useEffect(() => {
    if (config?.id) {
      setRunsLoading(true);
      setRunsError(null);
      DefaultService.apiIntegrationKubernetesReleaseRunGet({
        configId: config.id,
      })
        .then((resp: any) => {
          if (resp.status === "success" && Array.isArray(resp.data)) {
            setRuns(resp.data);
          } else {
            setRuns([]);
            setRunsError("Failed to fetch runs");
          }
        })
        .catch((err: any) => {
          setRuns([]);
          setRunsError(err?.message || "Failed to fetch runs");
        })
        .finally(() => setRunsLoading(false));
    }
  }, [config?.id]);

  const handleRunSubmit = async (values: any) => {
    if (!config?.id) return;
    try {
      await DefaultService.apiIntegrationKubernetesReleaseRunPost({
        requestBody: {
          ...values,
          deployment_config_id: config.id,
          status: "pending",
        },
      });
      setShowRunSheet(false);
      setRunsLoading(true);
      setRunsError(null);
      DefaultService.apiIntegrationKubernetesReleaseRunGet({
        configId: config.id,
      })
        .then((resp: any) => {
          if (resp.status === "success" && Array.isArray(resp.data)) {
            setRuns(resp.data);
          } else {
            setRuns([]);
            setRunsError("Failed to fetch runs");
          }
        })
        .catch((err: any) => {
          setRuns([]);
          setRunsError(err?.message || "Failed to fetch runs");
        })
        .finally(() => setRunsLoading(false));
      form.reset();
    } catch (e) {
      // TODO: show error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!(config.soft_delete || config.hard_delete) && (
          <Button onClick={() => setShowRunSheet(true)} size="sm">
            Run
          </Button>
        )}
      </div>
      {runsLoading && <div className="text-gray-500">Loading runs...</div>}
      {runsError && <div className="text-red-500">{runsError}</div>}
      {!runsLoading && !runsError && (
        <ResourceTable
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Image", accessor: "image_name" },
            { header: "PR URL", accessor: "pr_url" },
            { header: "Jira", accessor: "jira" },
            { header: "Status", accessor: "status" },
          ]}
          data={runs}
          className="p-0"
        />
      )}
      <Sheet open={showRunSheet} onOpenChange={setShowRunSheet}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Run Deployment</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(handleRunSubmit)}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Image Name<span className="text-red-500">*</span>
              </label>
              <Input
                {...form.register("image_name", { required: true })}
                placeholder="e.g. my-app:latest"
              />
              {form.formState.errors.image_name && (
                <span className="text-xs text-red-500">
                  Image name is required
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PR URL</label>
              <Input
                {...form.register("pr_url")}
                placeholder="e.g. https://github.com/org/repo/pull/123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jira</label>
              <Input
                {...form.register("jira")}
                placeholder="e.g. PROJECT-123"
              />
            </div>
            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Run
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

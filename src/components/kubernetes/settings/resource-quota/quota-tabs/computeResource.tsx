import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { QuotaFormValues } from '../types/quota';

const ComputeResourcesTab: React.FC = () => {
  const form = useFormContext<QuotaFormValues>();
  const computeQuotaEnabled = form.watch("computeQuota");
  
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="quotaName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resource Quota Name</FormLabel>
            <FormControl>
              <Input placeholder="resource-quota" {...field} />
            </FormControl>
            <FormDescription>
              Name for the resource quota object
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="quotaNamespace"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resource Quota Namespace</FormLabel>
            <FormControl>
              <Input placeholder="default" {...field} />
            </FormControl>
            <FormDescription>
              Namespace where resource quota will take affect
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="computeQuota"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Compute Resource Quota
              </FormLabel>
              <FormDescription>
                Limit CPU and memory usage in this namespace
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {computeQuotaEnabled && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="limitsCpu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPU Limits</FormLabel>
                  <FormControl>
                    <Input placeholder="8" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum CPU cores (e.g., 8 for 8 cores)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limitsMemory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memory Limits</FormLabel>
                  <FormControl>
                    <Input placeholder="16Gi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum memory (e.g., 16Gi for 16 gibibytes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestsCpu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPU Requests</FormLabel>
                  <FormControl>
                    <Input placeholder="4" {...field} />
                  </FormControl>
                  <FormDescription>
                    Minimum CPU cores (e.g., 4 for 4 cores)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestsMemory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memory Requests</FormLabel>
                  <FormControl>
                    <Input placeholder="8Gi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Minimum memory (e.g., 8Gi for 8 gibibytes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hugepages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hugepages</FormLabel>
                  <FormControl>
                    <Input placeholder="1Gi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Hugepages allocation (e.g., 1Gi)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputeResourcesTab;
import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { QuotaFormValues } from '../types/quota';

const PriorityClassTab: React.FC<{ namespace: string }> = ({ namespace }) => {
  const form = useFormContext<QuotaFormValues>();
  const priorityClassQuotaEnabled = form.watch("priorityClassQuota");
  const volumeAttributesClassQuotaEnabled = form.watch("volumeAttributesClassQuota");
  
  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name="priorityClassQuota"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Priority Class Quota</FormLabel>
              <FormDescription>
                Apply quotas to pods with specific priority classes
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {priorityClassQuotaEnabled && (
        <div className="border rounded-md p-4 bg-muted/50">
          <h3 className="text-sm font-medium mb-2">Priority Class YAML Syntax:</h3>
          <pre className="text-xs overflow-x-auto">
{`apiVersion: v1
kind: ResourceQuota
metadata:
  name: priority-class-quota-high
  namespace: ${namespace}
spec:
  hard:
    pods: "10"
    cpu: "4"
    memory: "8Gi"
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high"]  # Priority class name`}
          </pre>
        </div>
      )}
      
      <Separator />
      
      <FormField
        control={form.control}
        name="volumeAttributesClassQuota"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Volume Attributes Class Quota</FormLabel>
              <FormDescription>
                Apply quotas to PVCs with specific volume attributes classes
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {volumeAttributesClassQuotaEnabled && (
        <div className="border rounded-md p-4 bg-muted/50">
          <h3 className="text-sm font-medium mb-2">Volume Attributes Class YAML Syntax:</h3>
          <pre className="text-xs overflow-x-auto">
{`apiVersion: v1
kind: ResourceQuota
metadata:
  name: volume-attrs-quota-gold
  namespace: ${namespace}
spec:
  hard:
    requests.storage: "50Gi"
    persistentvolumeclaims: "5"
  scopeSelector:
    matchExpressions:
    - scopeName: VolumeAttributesClass
      operator: In
      values: ["gold"]  # Volume attributes class name`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PriorityClassTab;
import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { QuotaFormValues } from '../types/quota';

const StorageResourcesTab: React.FC = () => {
  const form = useFormContext<QuotaFormValues>();
  const storageQuotaEnabled = form.watch("storageQuota");
  
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="storageQuota"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Storage Resource Quota</FormLabel>
              <FormDescription>
                Limit storage resources in this namespace
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
      
      {storageQuotaEnabled && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="requestsStorage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Requests</FormLabel>
                  <FormControl>
                    <Input placeholder="100Gi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Total storage requests across all PVCs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="persistentvolumeclaims"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PersistentVolumeClaims</FormLabel>
                  <FormControl>
                    <Input placeholder="10" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum number of PersistentVolumeClaims
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Storage Class Quotas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set quotas for specific storage classes using Advanced YAML editor
            </p>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <pre className="text-xs overflow-x-auto">
{`# Storage Class Quota Example
gold.storageclass.storage.k8s.io/requests.storage: "10Gi"
gold.storageclass.storage.k8s.io/persistentvolumeclaims: "5"
silver.storageclass.storage.k8s.io/requests.storage: "20Gi"
silver.storageclass.storage.k8s.io/persistentvolumeclaims: "10"`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageResourcesTab;
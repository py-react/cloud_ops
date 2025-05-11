import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { QuotaFormValues } from '../types/quota';

const ObjectCountsTab: React.FC = () => {
  const form = useFormContext<QuotaFormValues>();
  const objectQuotaEnabled = form.watch("objectQuota");
  
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="objectQuota"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Object Count Quota</FormLabel>
              <FormDescription>
                Limit the number of Kubernetes objects that can exist in this namespace
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
      
      {objectQuotaEnabled && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pods</FormLabel>
                  <FormControl>
                    <Input placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="configmaps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ConfigMaps</FormLabel>
                  <FormControl>
                    <Input placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secrets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secrets</FormLabel>
                  <FormControl>
                    <Input placeholder="20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services</FormLabel>
                  <FormControl>
                    <Input placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="servicesLoadBalancers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LoadBalancer Services</FormLabel>
                  <FormControl>
                    <Input placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="servicesNodePorts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NodePort Services</FormLabel>
                  <FormControl>
                    <Input placeholder="2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="replicationcontrollers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ReplicationControllers</FormLabel>
                  <FormControl>
                    <Input placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Custom Object Counts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set quotas for specific resource types using count/&lt;resource&gt;.&lt;group&gt; syntax
            </p>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <pre className="text-xs overflow-x-auto">
{`# Custom Object Count Examples 
count/deployments.apps: "10"
count/replicasets.apps: "20" 
count/statefulsets.apps: "5"
count/jobs.batch: "20"
count/cronjobs.batch: "10"`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectCountsTab;
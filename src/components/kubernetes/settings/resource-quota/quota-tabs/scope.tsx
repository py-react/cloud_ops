import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { QuotaFormValues } from '../types/quota';

const ScopesTab: React.FC = () => {
  const form = useFormContext<QuotaFormValues>();
  const scopesEnabled = form.watch("enableScopes");
  
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="enableScopes"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Quota Scopes</FormLabel>
              <FormDescription>
                Apply quotas only to resources that match specific scopes
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
      
      {scopesEnabled && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scopeSelector.terminating"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Terminating</FormLabel>
                    <FormDescription className="text-xs">
                      Match pods with activeDeadlineSeconds ≥ 0
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
            
            <FormField
              control={form.control}
              name="scopeSelector.notTerminating"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>NotTerminating</FormLabel>
                    <FormDescription className="text-xs">
                      Match pods with no activeDeadlineSeconds
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
            
            <FormField
              control={form.control}
              name="scopeSelector.bestEffort"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>BestEffort</FormLabel>
                    <FormDescription className="text-xs">
                      Match pods with best-effort quality of service
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
            
            <FormField
              control={form.control}
              name="scopeSelector.notBestEffort"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>NotBestEffort</FormLabel>
                    <FormDescription className="text-xs">
                      Match pods without best-effort QoS
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
            
            <FormField
              control={form.control}
              name="scopeSelector.crossNamespacePodAffinity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>CrossNamespacePodAffinity</FormLabel>
                    <FormDescription className="text-xs">
                      Match pods with cross-namespace affinity terms
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
          </div>
          
          <div className="mt-4 border rounded-md p-4 bg-muted/50">
            <h3 className="text-sm font-medium mb-2">Scope YAML Syntax:</h3>
            <pre className="text-xs overflow-x-auto">
{`# Using scopes array
spec:
  scopes:
    - "Terminating"      # Or "NotTerminating"
    - "BestEffort"       # Or "NotBestEffort"

# Using scopeSelector (more flexible)
spec:
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high"]
    - scopeName: CrossNamespacePodAffinity
      operator: Exists`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScopesTab;
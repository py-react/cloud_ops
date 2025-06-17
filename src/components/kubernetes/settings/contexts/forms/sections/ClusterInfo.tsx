import React from "react";
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RequiredBadge, OptionalBadge } from "../badges";


export const ClusterTab = ({ control, errors }: { control: any; errors: any }) => (
    <div className="space-y-4">
      <FormField
        control={control}
        name="server"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Server URL <RequiredBadge />
            </FormLabel>
            <FormDescription>
              The URL of the Kubernetes API server (e.g., https://kubernetes.example.com)
            </FormDescription>
            <FormControl>
              <Input placeholder="https://kubernetes.example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
  
      <FormField
        control={control}
        name="certificate_authority_data"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Certificate Authority Data <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Base64 encoded certificate data for server verification
            </FormDescription>
            <FormControl>
              <Input placeholder="Base64 encoded certificate data" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
  
      <FormField
        control={control}
        name="insecure_skip_tls_verify"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="m-0">Skip TLS verification</FormLabel>
              <FormDescription>
                Warning: Only use in development environments
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
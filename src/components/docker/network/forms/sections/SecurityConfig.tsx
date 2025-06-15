import React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

export function SecurityConfig({ control, errors }: { control: any; errors: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormField
          control={control}
          name="internal"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="m-0">
                  Internal Network
                </FormLabel>
                <FormDescription>
                  Restrict external access to the network
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="enable_ipv6"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="m-0">
                  Enable IPv6
                </FormLabel>
                <FormDescription>
                  Enable IPv6 networking
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="attachable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="m-0">
                  Attachable
                </FormLabel>
                <FormDescription>
                  Allow manual container attachment
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ingress"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="m-0">
                  Ingress
                </FormLabel>
                <FormDescription>
                  Create an ingress network
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 
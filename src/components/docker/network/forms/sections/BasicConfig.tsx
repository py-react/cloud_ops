import React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OptionalBadge, RequiredBadge } from "@/components/docker/network/forms/badges";

export function BasicConfig({ control, errors }: { control: any; errors: any }) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Network Name <RequiredBadge />
            </FormLabel>
            <FormDescription>
              A unique name to identify this Docker network
            </FormDescription>
            <FormControl>
              <Input placeholder="my-network" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="driver"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Driver <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Network driver to use (default: bridge)
            </FormDescription>
            <FormControl>
              <Input placeholder="bridge" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="scope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Scope <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Network scope (default: local)
            </FormDescription>
            <FormControl>
              <Input placeholder="local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 
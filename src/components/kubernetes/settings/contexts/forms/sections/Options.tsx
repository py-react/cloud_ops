import React from "react";
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OptionalBadge } from "../badges";


export const OptionsTab = ({ control, errors }: { control: any; errors: any }) => (
    <div className="grid grid-cols-2 gap-6">
      <FormField
        control={control}
        name="set_current"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-2 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                className="w-4 h-4 mt-1"
                checked={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="m-0">Set as current context</FormLabel>
              <FormDescription>
                Make this the active context for all operations
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
  
      <FormField
        control={control}
        name="config_file"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Config File Path <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Location to save the Kubernetes config file
            </FormDescription>
            <FormControl>
              <Input placeholder="~/.kube/config" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
import React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface BasicConfigProps {
  control: Control<any>;
  errors: any;
  watch: UseFormWatch<any>;
}

export function BasicConfig({ control, errors, watch }: BasicConfigProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Volume Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription>
                A unique name to identify this Docker volume
              </FormDescription>
              <FormControl>
                <Input placeholder="my-volume" {...field} />
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
              <FormLabel className="text-sm font-medium text-foreground/80">
                Driver
              </FormLabel>
              <FormDescription>
                Volume driver to use (default: local)
              </FormDescription>
              <FormControl>
                <Input placeholder="local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 
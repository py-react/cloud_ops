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
  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Volume Name <RequiredBadge />
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
              <FormLabel>
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
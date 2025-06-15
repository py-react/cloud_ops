import React from 'react';
import { UseFormRegister, UseFormWatch, Control } from 'react-hook-form';
import type { ContainerRunConfig } from '../types';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface BasicConfigProps {
  control: Control<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
}

export function BasicConfig({ control, errors, watch }: BasicConfigProps) {
  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  // Helper to indicate optional fields
  const OptionalBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
      Optional
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Main Fields in Grid, 2 per row, preserve spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1 */}
        <FormField
          control={control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Image <RequiredBadge />
              </FormLabel>
              <FormDescription>
                The Docker image to use for this container
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., nginx:latest" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Container Name <RequiredBadge />
              </FormLabel>
              <FormDescription>
                A name for this container
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., my-container" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Row 2 */}
        <FormField
          control={control}
          name="command"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Command <OptionalBadge />
              </FormLabel>
              <FormDescription>
                The command to run in the container
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., /bin/bash" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div />
      </div>

      {/* Runtime Options in a row */}
      <div className="flex flex-col md:flex-row gap-6">
        <FormField
          control={control}
          name="detach"
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
                  Detach
                </FormLabel>
                <FormDescription>
                  Run container in background
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="removeOnExit"
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
                  Remove on Exit
                </FormLabel>
                <FormDescription>
                  Automatically remove the container when it exits
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="privileged"
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
                  Privileged
                </FormLabel>
                <FormDescription>
                  Give extended privileges to this container
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
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
              <FormLabel className="text-sm font-medium text-foreground/80">
                Image <span className="text-red-500">*</span>
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
              <FormLabel className="text-sm font-medium text-foreground/80">
                Container Name <span className="text-red-500">*</span>
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
              <FormLabel className="text-sm font-medium text-foreground/80">
                Command
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
      <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
        <h4 className="text-sm font-medium mb-4 text-foreground/80 flex items-center gap-2">
          Runtime Options
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="detach"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Detach
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Run in background
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="removeOnExit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Auto-remove
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Remove on exit
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="privileged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Privileged
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Elevated permissions
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
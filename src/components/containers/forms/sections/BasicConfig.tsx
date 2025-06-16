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
      {/* Required Fields */}
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

      {/* Optional Fields */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Container Name <OptionalBadge />
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

      <FormField
        control={control}
        name="entrypoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Entrypoint <OptionalBadge />
            </FormLabel>
            <FormDescription>
              The entrypoint for the container
            </FormDescription>
            <FormControl>
              <Input placeholder="e.g., /docker-entrypoint.sh" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="workingDir"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Working Directory <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Working directory inside the container
            </FormDescription>
            <FormControl>
              <Input placeholder="e.g., /app" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Runtime Options */}
      <div className="space-y-4">
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
          name="tty"
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
                  TTY
                </FormLabel>
                <FormDescription>
                  Allocate a pseudo-TTY
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="stdinOpen"
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
                  Keep STDIN Open
                </FormLabel>
                <FormDescription>
                  Keep STDIN open even if not attached
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

        <FormField
          control={control}
          name="init"
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
                  Init
                </FormLabel>
                <FormDescription>
                  Run an init inside the container
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
import React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
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

interface AdvancedConfigProps {
  control: Control<ContainerRunConfig>;
  watch: UseFormWatch<ContainerRunConfig>;
  errors: any;
}

export function AdvancedConfig({ control, watch, errors }: AdvancedConfigProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User</FormLabel>
              <FormDescription>e.g., nginx</FormDescription>
              <FormControl>
                <Input placeholder="e.g., nginx" {...field} />
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
              <FormLabel>Working Directory</FormLabel>
              <FormDescription>e.g., /app</FormDescription>
              <FormControl>
                <Input placeholder="e.g., /app" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="domainname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain Name</FormLabel>
              <FormDescription>e.g., example.com</FormDescription>
              <FormControl>
                <Input placeholder="e.g., example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostname</FormLabel>
              <FormDescription>e.g., container1</FormDescription>
              <FormControl>
                <Input placeholder="e.g., container1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="space-y-2">
        <FormLabel>Runtime Options</FormLabel>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="init"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <span className="ml-2 text-sm text-gray-700">Init Process</span>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tty"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <span className="ml-2 text-sm text-gray-700">Allocate TTY</span>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="stdinOpen"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <span className="ml-2 text-sm text-gray-700">Keep STDIN Open</span>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="readOnly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <span className="ml-2 text-sm text-gray-700">Read Only Root FS</span>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
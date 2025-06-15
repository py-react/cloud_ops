import React from 'react';
import { Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
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

interface HealthConfigProps {
  control: Control<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function HealthConfig({ control, errors, watch, setValue }: HealthConfigProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="healthcheck.test.0"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Command</FormLabel>
              <FormDescription>e.g., CMD-SHELL curl -f http://localhost/ || exit 1</FormDescription>
              <FormControl>
                <Input placeholder="e.g., CMD-SHELL curl -f http://localhost/ || exit 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="healthcheck.interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interval (seconds)</FormLabel>
              <FormDescription>e.g., 30s</FormDescription>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  {...field}
                  onChange={e => setValue('healthcheck.interval', parseInt(e.target.value) * 1000000000)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="healthcheck.timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (seconds)</FormLabel>
              <FormDescription>e.g., 10s</FormDescription>
              <FormControl>
                <Input
                  type="number"
                  placeholder="3"
                  {...field}
                  onChange={e => setValue('healthcheck.timeout', parseInt(e.target.value) * 1000000000)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="healthcheck.retries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retries</FormLabel>
              <FormDescription>e.g., 3</FormDescription>
              <FormControl>
                <Input type="number" placeholder="3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
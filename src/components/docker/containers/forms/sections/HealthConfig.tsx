import React from 'react';
import { Control } from 'react-hook-form';
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
}

export function HealthConfig({ control, errors }: HealthConfigProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="healthcheck.test.0"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">Test Command</FormLabel>
              <FormDescription>The command to run to check container health</FormDescription>
              <FormControl>
                <Input placeholder="e.g., curl -f http://localhost/ || exit 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-border/40 p-4 bg-muted/20 md:col-span-2">
          <h4 className="text-sm font-medium mb-4 text-foreground/80 flex items-center gap-2">
            Health Check Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="healthcheck.interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Interval (sec)</FormLabel>
                  <FormDescription className="text-xs">Time between checks</FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      min={0}
                      value={field.value ? field.value / 1000000000 : ""}
                      onChange={e => {
                        const val = e.target.value === "" ? undefined : parseInt(e.target.value) * 1000000000;
                        field.onChange(val);
                      }}
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
                  <FormLabel className="text-sm font-medium">Timeout (sec)</FormLabel>
                  <FormDescription className="text-xs">Max time for check</FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="3"
                      min={0}
                      value={field.value ? field.value / 1000000000 : ""}
                      onChange={e => {
                        const val = e.target.value === "" ? undefined : parseInt(e.target.value) * 1000000000;
                        field.onChange(val);
                      }}
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
                  <FormLabel className="text-sm font-medium">Retries</FormLabel>
                  <FormDescription className="text-xs">Consecutive failures</FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="3"
                      min={0}
                      {...field}
                      value={field.value ?? ""}
                      onChange={e => {
                        const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { UseFormWatch, Control } from 'react-hook-form';
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

interface ResourceConfigProps {
  control: Control<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
}

export function ResourceConfig({ control, errors, watch }: ResourceConfigProps) {

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="memory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Memory Limit
              </FormLabel>
              <FormDescription>
                Maximum amount of memory the container can use (e.g., 512m, 2g)
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., 512m" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="cpuShares"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                CPU Shares
              </FormLabel>
              <FormDescription>
                CPU shares (relative weight) for the container
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="e.g., 1024"
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="memoryReservation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Memory Reservation
              </FormLabel>
              <FormDescription>
                Memory soft limit for the container (e.g., 256m, 1g)
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., 256m" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="memorySwap"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Memory Swap
              </FormLabel>
              <FormDescription>
                Total memory limit (memory + swap) for the container (e.g., 1g, 2g)
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., 1g" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
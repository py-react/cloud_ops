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
  // Helper to indicate optional fields
  const OptionalBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
      Optional
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="memory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Memory Limit <OptionalBadge />
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
              <FormLabel>
                CPU Shares <OptionalBadge />
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
              <FormLabel>
                Memory Reservation <OptionalBadge />
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
              <FormLabel>
                Memory Swap <OptionalBadge />
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
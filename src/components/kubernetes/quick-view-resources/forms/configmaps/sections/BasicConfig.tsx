import React from 'react';
import { ConfigMapFormData, SectionProps } from '../types';
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
import { Card, CardContent } from "@/components/ui/card";

export function BasicConfig({ control, errors, watch }: SectionProps) {
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
    <Card className="p-0 border-none shadow-none">
      <CardContent className="p-0">
        <div className="space-y-6">
          {/* Main Fields in Grid, 2 per row, preserve spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <FormField
              control={control}
              name="metadata.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <RequiredBadge />
                  </FormLabel>
                  <FormDescription>
                    The name of the ConfigMap
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g., my-config" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="metadata.namespace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Namespace <OptionalBadge />
                  </FormLabel>
                  <FormDescription>
                    The namespace where the ConfigMap will be created
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g., default" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Runtime Options in a row */}
          <div className="flex flex-col md:flex-row gap-6">
            <FormField
              control={control}
              name="immutable"
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
                      Immutable
                    </FormLabel>
                    <FormDescription>
                      Make the ConfigMap immutable
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
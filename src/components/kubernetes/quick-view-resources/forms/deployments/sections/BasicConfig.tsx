import React from 'react';
import { DeploymentFormData, SectionProps } from '../types';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
                    The name of the Deployment
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g., my-deployment" {...field} />
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
                    The namespace where the Deployment will be created
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g., default" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Replicas Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="spec.replicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Replicas <OptionalBadge />
                  </FormLabel>
                  <FormDescription>
                    Number of desired pods
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      placeholder="e.g., 3" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
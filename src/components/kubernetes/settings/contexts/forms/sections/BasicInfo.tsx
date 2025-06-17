import React from "react";

import { Input } from "@/components/ui/input";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RequiredBadge, OptionalBadge } from "../badges";

export const BasicInfoTab = ({ control, errors }: { control: any; errors: any }) => (
    <div className="grid grid-cols-2 gap-6">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Context Name <RequiredBadge />
            </FormLabel>
            <FormDescription>
              A unique name to identify this Kubernetes context
            </FormDescription>
            <FormControl>
              <Input placeholder="production-cluster" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
  
      <FormField
        control={control}
        name="namespace"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Namespace <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Default namespace to use with this context
            </FormDescription>
            <FormControl>
              <Input placeholder="default" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
  
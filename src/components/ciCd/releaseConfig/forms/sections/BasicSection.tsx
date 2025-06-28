import React from "react";
import { Control, FieldErrors } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReleaseConfigFormData } from "../ReleaseConfigForm";
import { Switch } from "@/components/ui/switch";

interface BasicSectionProps {
  control: Control<ReleaseConfigFormData>;
  errors?: FieldErrors<ReleaseConfigFormData>;
}

export const BasicSection: React.FC<BasicSectionProps> = ({ control }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField
      control={control}
      name="namespace"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Namespace</FormLabel>
          <FormControl>
            <Input disabled={!!field.value} placeholder="e.g. default" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="deployment_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Deployment Name</FormLabel>
          <FormControl>
            <Input placeholder="e.g. my-app" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="deployment_strategy_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Deployment Strategy ID</FormLabel>
          <FormControl>
            <Input type="number" placeholder="e.g. 1" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="tag"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tag</FormLabel>
          <FormControl>
            <Input placeholder="e.g. v1.2.3" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="code_source_control_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Source Control Name</FormLabel>
          <FormControl>
            <Input placeholder="e.g. github-repo" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <div></div>
    <FormField
      control={control}
      name="soft_delete"
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
              Inactive
            </FormLabel>
            <FormDescription>
              Make this config not useable by runs
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  </div>
);

export default BasicSection; 
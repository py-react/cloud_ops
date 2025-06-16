import React from 'react';
import { Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
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
import { Button } from "@/components/ui/button";

interface SecurityConfigProps {
  control: Control<ContainerRunConfig>;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
  errors: any;
}

export function SecurityConfig({ control, watch, setValue, errors }: SecurityConfigProps) {
  const capAdd = watch('capAdd') || [];
  const capDrop = watch('capDrop') || [];

  const addCapability = (type: 'add' | 'drop') => {
    const field = type === 'add' ? 'capAdd' : 'capDrop';
    const current = watch(field) || [];
    setValue(field as any, [...current, '']);
  };

  const removeCapability = (type: 'add' | 'drop', index: number) => {
    const field = type === 'add' ? 'capAdd' : 'capDrop';
    const current = watch(field) || [];
    setValue(field as any, current.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>Add Capabilities</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => addCapability('add')}>
              <Plus className="w-4 h-4 mr-1" /> Add Capability
            </Button>
          </div>
          <div className="space-y-2">
            {capAdd.map((_: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <FormField
                  control={control}
                  name={`capAdd.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., SYS_ADMIN" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCapability('add', index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>Drop Capabilities</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => addCapability('drop')}>
              <Plus className="w-4 h-4 mr-1" /> Drop Capability
            </Button>
          </div>
          <div className="space-y-2">
            {capDrop.map((_: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <FormField
                  control={control}
                  name={`capDrop.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., NET_RAW" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCapability('drop', index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FormField
        control={control}
        name="userns"
        render={({ field }) => (
          <FormItem>
            <FormLabel>User Namespace Mode</FormLabel>
            <FormDescription>e.g., host</FormDescription>
            <FormControl>
              <Input placeholder="e.g., host" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
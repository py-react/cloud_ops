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

interface VolumeConfigProps {
  control: Control<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function VolumeConfig({ control, errors, watch, setValue }: VolumeConfigProps) {
  const volumes = watch('volumes') || [];

  const addVolume = () => {
    setValue('volumes', [
      ...volumes,
      { source: '', target: '', mode: 'rw' }
    ]);
  };

  const removeVolume = (index: number) => {
    setValue('volumes', volumes.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <FormLabel>Volume Mounts</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={addVolume}>
            <Plus className="w-4 h-4 mr-1" /> Add Volume
          </Button>
        </div>
        <FormDescription>
          Mount host directories or named volumes into the container.
        </FormDescription>
        <div className="space-y-2">
          {volumes.map((_: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <FormField
                control={control}
                name={`volumes.${index}.source`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Host Path" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span>:</span>
              <FormField
                control={control}
                name={`volumes.${index}.target`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Container Path" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`volumes.${index}.mode`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        {...field}
                      >
                        <option value="rw">RW</option>
                        <option value="ro">RO</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVolume(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
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
    </div>
  );
}
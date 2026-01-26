import React from 'react';
import { UseFormWatch, Control, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { ContainerRunConfig, PortMapping } from '../types';
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NetworkConfigProps {
  control: Control<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function NetworkConfig({ control, errors, watch, setValue }: NetworkConfigProps) {
  const ports = watch('ports') || {};

  const addPort = () => {
    const newPort: PortMapping = {
      hostPort: undefined,
      containerPort: 80,
      protocol: 'tcp'
    };
    setValue('ports', { ...ports, [`${Date.now()}`]: newPort });
  };

  const removePort = (key: string) => {
    const newPorts = { ...ports };
    delete newPorts[key];
    setValue('ports', newPorts);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network Mode */}
        <FormField
          control={control}
          name="networkMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Network Mode
              </FormLabel>
              <FormDescription>
                Network mode for the container
              </FormDescription>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Empty cell for grid alignment */}
        <div />
        {/* Port Mappings (span both columns) */}
        <div className="md:col-span-2 rounded-lg border border-border/40 p-4 bg-muted/20">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <FormLabel className="text-sm font-medium text-foreground/80">Port Mappings</FormLabel>
                <FormDescription className="text-xs">
                  Map container ports to host ports
                </FormDescription>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addPort}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Port
              </Button>
            </div>
            {Object.keys(ports).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                No ports mapped yet.
              </div>
            )}
            <div className="space-y-3">
              {Object.entries(ports).map(([key, port]) => (
                <div key={key} className="flex items-center gap-3">
                  <FormField
                    control={control}
                    name={`ports.${key}.protocol`}
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Protocol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                            <SelectItem value="sctp">SCTP</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`ports.${key}.hostPort`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            className="h-9"
                            type="number"
                            placeholder="Host Port"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-muted-foreground font-mono">:</span>
                  <FormField
                    control={control}
                    name={`ports.${key}.containerPort`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            className="h-9"
                            type="number"
                            placeholder="Container Port"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end w-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removePort(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  // Helper to indicate optional fields
  const OptionalBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
      Optional
    </span>
  );

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
      <FormField
        control={control}
        name="networkMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Network Mode <OptionalBadge />
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <FormLabel>Port Mappings</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={addPort}>
            <Plus className="w-4 h-4 mr-1" />
            Add Port
          </Button>
        </div>
        <FormDescription>
          Map container ports to host ports
        </FormDescription>
        <div className="space-y-4">
          {Object.entries(ports).map(([key, port]) => (
            <div key={key} className="flex items-center space-x-2">
              <FormField
                control={control}
                name={`ports.${key}.hostPort`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Host Port"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span>:</span>
              <FormField
                control={control}
                name={`ports.${key}.containerPort`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Container Port"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`ports.${key}.protocol`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePort(key)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <FormField
        control={control}
        name="dns"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              DNS Servers <OptionalBadge />
            </FormLabel>
            <FormDescription>
              DNS servers to use (comma-separated)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="e.g., 8.8.8.8,8.8.4.4"
                value={field.value?.join(',') || ''}
                onChange={e => field.onChange(e.target.value ? e.target.value.split(',') : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="dnsSearch"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              DNS Search Domains <OptionalBadge />
            </FormLabel>
            <FormDescription>
              DNS search domains (comma-separated)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="e.g., example.com,local"
                value={field.value?.join(',') || ''}
                onChange={e => field.onChange(e.target.value ? e.target.value.split(',') : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="extraHosts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Extra Hosts <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Additional host-to-IP mappings (comma-separated)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="e.g., host1:10.0.0.1,host2:10.0.0.2"
                value={field.value ? Object.entries(field.value).map(([host, ip]) => `${host}:${ip}`).join(',') : ''}
                onChange={e => {
                  const value = e.target.value;
                  if (!value) {
                    field.onChange(undefined);
                    return;
                  }
                  const hosts = value.split(',').reduce((acc, pair) => {
                    const [host, ip] = pair.split(':');
                    if (host && ip) {
                      acc[host.trim()] = ip.trim();
                    }
                    return acc;
                  }, {} as Record<string, string>);
                  field.onChange(hosts);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
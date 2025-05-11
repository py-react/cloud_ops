'use client'

import React,{ useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InitializeSwarmParams {
  advertise_addr: string;
  listen_addr: string;
  force_new_cluster: boolean;
  default_addr_pool: string[];
  subnet_size: number;
  data_path_addr: string;
  data_path_port: number;
  task_history_retention_limit: number;
  snapshot_interval: number;
  keep_old_snapshots: number;
  log_entries_for_slow_followers: number;
  heartbeat_tick: number;
  election_tick: number;
  dispatcher_heartbeat_period: number;
  node_cert_expiry: number;
  external_ca: string;
  name: string;
  labels: Record<string, string>;
  log_driver: string;
}

interface InitializeSwarmFormProps {
  onSubmit: (data: InitializeSwarmParams) => Promise<void>;
  onClose: () => void;
}

export function InitializeSwarmForm({ onSubmit, onClose }: InitializeSwarmFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<InitializeSwarmParams>({
    defaultValues: {
      force_new_cluster: false,
      subnet_size: 24,
      data_path_port: 4789,
    }
  });

  const [labels, setLabels] = useState<Record<string, string>>({});

  const handleFormSubmit = async (data: InitializeSwarmParams) => {
    try {
      data.labels = labels;
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to initialize swarm:', error);
    }
  };

  const addLabel = () => {
    setLabels({ ...labels, '': '' });
  };

  const updateLabel = (oldKey: string, newKey: string, value: string) => {
    const newLabels = { ...labels };
    if (oldKey !== newKey) {
      delete newLabels[oldKey];
    }
    newLabels[newKey] = value;
    setLabels(newLabels);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="advertise_addr">Advertise Address</Label>
          <Input
            id="advertise_addr"
            {...register('advertise_addr', { required: 'Advertise address is required' })}
            placeholder="192.168.1.1:4567"
          />
          {errors.advertise_addr && (
            <p className="text-sm text-red-600">{errors.advertise_addr.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="listen_addr">Listen Address</Label>
          <Input
            id="listen_addr"
            {...register('listen_addr')}
            placeholder="0.0.0.0:2377"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="force_new_cluster"
            {...register('force_new_cluster')}
          />
          <Label htmlFor="force_new_cluster">Force New Cluster</Label>
        </div>

        <div>
          <Label htmlFor="default_addr_pool">Default Address Pool</Label>
          <Input
            id="default_addr_pool"
            {...register('default_addr_pool')}
            placeholder="10.0.0.0/8"
          />
        </div>

        <div>
          <Label htmlFor="subnet_size">Subnet Size</Label>
          <Input
            id="subnet_size"
            type="number"
            {...register('subnet_size', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="data_path_addr">Data Path Address</Label>
          <Input
            id="data_path_addr"
            {...register('data_path_addr')}
            placeholder="192.168.1.1"
          />
        </div>

        <div>
          <Label htmlFor="data_path_port">Data Path Port</Label>
          <Input
            id="data_path_port"
            type="number"
            {...register('data_path_port', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="name">Swarm Name</Label>
          <Input
            id="name"
            {...register('name')}
          />
        </div>

        <div>
          <Label htmlFor="log_driver">Log Driver</Label>
          <Controller
            name="log_driver"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select log driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json-file">json-file</SelectItem>
                  <SelectItem value="journald">journald</SelectItem>
                  <SelectItem value="syslog">syslog</SelectItem>
                  <SelectItem value="gelf">gelf</SelectItem>
                  <SelectItem value="fluentd">fluentd</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label>Labels</Label>
          {Object.entries(labels).map(([key, value], index) => (
            <div key={index} className="flex space-x-2 mt-2">
              <Input
                placeholder="Key"
                value={key}
                onChange={(e) => updateLabel(key, e.target.value, value)}
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => updateLabel(key, key, e.target.value)}
              />
            </div>
          ))}
          <Button type="button" onClick={addLabel} variant="outline" className="mt-2">Add Label</Button>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Initialize Swarm
        </Button>
      </div>
    </form>
  );
}


import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeploymentFormData } from '../../yaml/yamlUtils';

interface PortsAndNetworkingSectionProps {
  data: Partial<DeploymentFormData>;
  onChange: (data: DeploymentFormData) => void;
}

export default function PortsAndNetworkingSection({ data, onChange }: PortsAndNetworkingSectionProps) {
  const servicePorts = data.service_ports || [];

  const addPort = () => {
    onChange({
      ...data,
      service_ports: [...servicePorts, { port: 0, target_port: 0, protocol: 'TCP' }],
    } as DeploymentFormData);
  };

  const updatePort = (index: number, field: string, value: any) => {
    const newPorts = [...servicePorts];
    newPorts[index] = { ...newPorts[index], [field]: value };
    onChange({ ...data, service_ports: newPorts } as DeploymentFormData);
  };

  const removePort = (index: number) => {
    onChange({
      ...data,
      service_ports: servicePorts.filter((_, i) => i !== index),
    } as DeploymentFormData);
  };

  return (
    <div className="space-y-4">
      {servicePorts.map((port, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label className="text-sm">Port</Label>
            <Input
              type="number"
              value={port.port}
              onChange={(e) => updatePort(index, 'port', parseInt(e.target.value) || 0)}
              placeholder="80"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-sm">Target Port</Label>
            <Input
              type="number"
              value={port.target_port}
              onChange={(e) => updatePort(index, 'target_port', parseInt(e.target.value) || 0)}
              placeholder="8080"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-sm">Protocol</Label>
            <Select
              value={port.protocol}
              onValueChange={(value) => updatePort(index, 'protocol', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TCP">TCP</SelectItem>
                <SelectItem value="UDP">UDP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => removePort(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addPort} className="w-full">
        Add Port Mapping
      </Button>
    </div>
  );
}

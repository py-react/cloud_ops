import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeploymentFormData } from '../../yaml/yamlUtils';

interface StorageSectionProps {
  data: Partial<DeploymentFormData>;
  onChange: (data: DeploymentFormData) => void;
}

export default function StorageSection({ data, onChange }: StorageSectionProps) {
  const volumes = data.volumes || [];

  const addVolume = () => {
    onChange({
      ...data,
      volumes: [...volumes, { name: '', emptyDir: {} }],
    } as DeploymentFormData);
  };

  const updateVolume = (index: number, field: string, value: any) => {
    const newVolumes = [...volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    onChange({ ...data, volumes: newVolumes } as DeploymentFormData);
  };

  const removeVolume = (index: number) => {
    onChange({
      ...data,
      volumes: volumes.filter((_, i) => i !== index),
    } as DeploymentFormData);
  };

  return (
    <div className="space-y-4">
      {volumes.map((volume, index) => (
        <div key={index} className="border rounded-lg p-3 space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-sm">Volume Name</Label>
              <Input
                value={volume.name}
                onChange={(e) => updateVolume(index, 'name', e.target.value)}
                placeholder="volume-name"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => removeVolume(index)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addVolume} className="w-full">
        Add Volume
      </Button>
    </div>
  );
}

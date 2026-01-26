import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeploymentFormData } from '../../yaml/yamlUtils';

interface ResourcesSectionProps {
  data: Partial<DeploymentFormData>;
  onChange: (data: DeploymentFormData) => void;
}

export default function ResourcesSection({ data, onChange }: ResourcesSectionProps) {
  const resources = data.containers?.[0]?.resources || { requests: {}, limits: {} };

  const updateResources = (type: 'requests' | 'limits', field: 'cpu' | 'memory', value: string) => {
    onChange({
      ...data,
      containers: [
        {
          ...data.containers![0],
          resources: {
            ...resources,
            [type]: {
              ...resources[type],
              [field]: value,
            },
          },
        },
      ],
    } as DeploymentFormData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Requests (Guaranteed)</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">CPU</Label>
            <Input
              value={resources.requests?.cpu || ''}
              onChange={(e) => updateResources('requests', 'cpu', e.target.value)}
              placeholder="100m"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Memory</Label>
            <Input
              value={resources.requests?.memory || ''}
              onChange={(e) => updateResources('requests', 'memory', e.target.value)}
              placeholder="128Mi"
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Limits (Maximum)</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">CPU</Label>
            <Input
              value={resources.limits?.cpu || ''}
              onChange={(e) => updateResources('limits', 'cpu', e.target.value)}
              placeholder="500m"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Memory</Label>
            <Input
              value={resources.limits?.memory || ''}
              onChange={(e) => updateResources('limits', 'memory', e.target.value)}
              placeholder="512Mi"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

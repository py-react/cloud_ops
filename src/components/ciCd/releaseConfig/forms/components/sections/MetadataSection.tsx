import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeploymentFormData } from '../../yaml/yamlUtils';

interface MetadataSectionProps {
  data: Partial<DeploymentFormData>;
  onChange: (data: DeploymentFormData) => void;
}

export default function MetadataSection({ data, onChange }: MetadataSectionProps) {
  const labels = data.labels || {};
  const annotations = data.annotations || {};

  const updateLabels = (key: string, value: string, remove?: boolean) => {
    const newLabels = { ...labels };
    if (remove) {
      delete newLabels[key];
    } else {
      newLabels[key] = value;
    }
    onChange({ ...data, labels: newLabels } as DeploymentFormData);
  };

  const updateAnnotations = (key: string, value: string, remove?: boolean) => {
    const newAnnotations = { ...annotations };
    if (remove) {
      delete newAnnotations[key];
    } else {
      newAnnotations[key] = value;
    }
    onChange({ ...data, annotations: newAnnotations } as DeploymentFormData);
  };

  const addLabel = () => updateLabels('key', 'value');
  const addAnnotation = () => updateAnnotations('key', 'value');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium">Labels</Label>
        {Object.entries(labels).map(([key, value]) => (
          <div key={key} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Input
                value={key}
                onChange={(e) => {
                  const newLabels = { ...labels };
                  delete newLabels[key];
                  newLabels[e.target.value] = value;
                  onChange({ ...data, labels: newLabels } as DeploymentFormData);
                }}
                placeholder="key"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={value}
                onChange={(e) => updateLabels(key, e.target.value)}
                placeholder="value"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => updateLabels(key, '', true)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addLabel} className="w-full">
          Add Label
        </Button>
      </div>
      <div className="space-y-4">
        <Label className="text-sm font-medium">Annotations</Label>
        {Object.entries(annotations).map(([key, value]) => (
          <div key={key} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Input
                value={key}
                onChange={(e) => {
                  const newAnnotations = { ...annotations };
                  delete newAnnotations[key];
                  newAnnotations[e.target.value] = value;
                  onChange({ ...data, annotations: newAnnotations } as DeploymentFormData);
                }}
                placeholder="key"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={value}
                onChange={(e) => updateAnnotations(key, e.target.value)}
                placeholder="value"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => updateAnnotations(key, '', true)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addAnnotation} className="w-full">
          Add Annotation
        </Button>
      </div>
    </div>
  );
}

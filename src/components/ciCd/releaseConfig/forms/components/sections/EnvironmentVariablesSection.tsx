import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeploymentFormData } from '../../yaml/yamlUtils';

interface EnvironmentVariablesSectionProps {
  data: Partial<DeploymentFormData>;
  onChange: (data: DeploymentFormData) => void;
}

export default function EnvironmentVariablesSection({ data, onChange }: EnvironmentVariablesSectionProps) {
  const envVars = data.containers?.[0]?.env || [];

  const addEnvVar = () => {
    onChange({
      ...data,
      containers: [
        {
          ...data.containers![0],
          env: [...envVars, { name: '', value: '' }],
        },
      ],
    } as DeploymentFormData);
  };

  const updateEnvVar = (index: number, field: string, value: string) => {
    onChange({
      ...data,
      containers: [
        {
          ...data.containers![0],
          env: envVars.map((env, i) => (i === index ? { ...env, [field]: value } : env)),
        },
      ],
    } as DeploymentFormData);
  };

  const removeEnvVar = (index: number) => {
    onChange({
      ...data,
      containers: [
        {
          ...data.containers![0],
          env: envVars.filter((_, i) => i !== index),
        },
      ],
    } as DeploymentFormData);
  };

  return (
    <div className="space-y-4">
      {envVars.map((env, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label className="text-sm">Name</Label>
            <Input
              value={env.name}
              onChange={(e) => updateEnvVar(index, 'name', e.target.value)}
              placeholder="ENV_NAME"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-sm">Value</Label>
            <Input
              value={env.value}
              onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
              placeholder="value"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => removeEnvVar(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addEnvVar} className="w-full">
        Add Environment Variable
      </Button>
    </div>
  );
}

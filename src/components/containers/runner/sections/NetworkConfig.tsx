import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { ContainerRunConfig, PortMapping } from '../types';

interface NetworkConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function NetworkConfig({ register, errors, watch, setValue }: NetworkConfigProps) {
  const ports = watch('ports');

  const addPort = () => {
    const newPort: PortMapping = {
      hostPort: null,
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
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Network Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Network Mode</label>
          <select
            {...register('networkMode')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="bridge">Bridge</option>
            <option value="host">Host</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Port Mappings</label>
            <button
              type="button"
              onClick={addPort}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 
                       hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Port
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(ports).map(([key, port]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="number"
                  {...register(`ports.${key}.hostPort` as any)}
                  placeholder="Host Port"
                  className="w-24 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                />
                <span>:</span>
                <input
                  type="number"
                  {...register(`ports.${key}.containerPort` as any)}
                  placeholder="Container Port"
                  className="w-24 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                />
                <select
                  {...register(`ports.${key}.protocol` as any)}
                  className="w-24 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="sctp">SCTP</option>
                </select>
                <button
                  type="button"
                  onClick={() => removePort(key)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
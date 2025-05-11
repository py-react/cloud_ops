import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { ContainerRunConfig } from '../types';

interface SecurityConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
  errors: any;
}

export function SecurityConfig({ register, watch, setValue, errors }: SecurityConfigProps) {
  const capAdd = watch('capAdd') || [];
  const capDrop = watch('capDrop') || [];

  const addCapability = (type: 'add' | 'drop') => {
    const field = type === 'add' ? 'capAdd' : 'capDrop';
    const current = watch(field) || [];
    setValue(field as any, [...current, '']);
  };

  const removeCapability = (type: 'add' | 'drop', index: number) => {
    const field = type === 'add' ? 'capAdd' : 'capDrop';
    const current = watch(field) || [];
    setValue(field as any, current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Security Configuration</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Add Capabilities</label>
            <button
              type="button"
              onClick={() => addCapability('add')}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 
                       hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Capability
            </button>
          </div>
          
          <div className="space-y-2">
            {capAdd.map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  {...register(`capAdd.${index}` as any)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., SYS_ADMIN"
                />
                <button
                  type="button"
                  onClick={() => removeCapability('add', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Drop Capabilities</label>
            <button
              type="button"
              onClick={() => addCapability('drop')}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 
                       hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Capability
            </button>
          </div>
          
          <div className="space-y-2">
            {capDrop.map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  {...register(`capDrop.${index}` as any)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., NET_RAW"
                />
                <button
                  type="button"
                  onClick={() => removeCapability('drop', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">User Namespace Mode</label>
          <input
            {...register('userns')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., host"
          />
        </div>
      </div>
    </div>
  );
}
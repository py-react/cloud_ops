import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { ContainerRunConfig, VolumeMount } from '../types';

interface VolumeConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function VolumeConfig({ register, errors, watch, setValue }: VolumeConfigProps) {
  const volumes = watch('volumes');

  const addVolume = () => {
    setValue('volumes', [
      ...volumes,
      { source: '', target: '', mode: 'rw' }
    ]);
  };

  const removeVolume = (index: number) => {
    setValue('volumes', volumes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Volume Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Volume Mounts</label>
            <button
              type="button"
              onClick={addVolume}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 
                       hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Volume
            </button>
          </div>

          <div className="space-y-2">
            {volumes.map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  {...register(`volumes.${index}.source` as any)}
                  placeholder="Host Path"
                  className="flex-1 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                />
                <span>:</span>
                <input
                  {...register(`volumes.${index}.target` as any)}
                  placeholder="Container Path"
                  className="flex-1 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                />
                <select
                  {...register(`volumes.${index}.mode` as any)}
                  className="w-24 rounded-md border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="rw">RW</option>
                  <option value="ro">RO</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeVolume(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Working Directory</label>
          <input
            {...register('workingDir')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., /app"
          />
        </div>
      </div>
    </div>
  );
}
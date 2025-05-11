import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { ContainerRunConfig } from '../types';

interface HealthConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
  setValue: UseFormSetValue<ContainerRunConfig>;
}

export function HealthConfig({ register, errors, watch, setValue }: HealthConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Health Check Configuration</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Test Command</label>
          <input
            {...register('healthcheck.test.0')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., CMD-SHELL curl -f http://localhost/"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Interval (seconds)</label>
          <input
            type="number"
            {...register('healthcheck.interval')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="30"
            onChange={(e) => setValue('healthcheck.interval', parseInt(e.target.value) * 1000000000)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timeout (seconds)</label>
          <input
            type="number"
            {...register('healthcheck.timeout')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="3"
            onChange={(e) => setValue('healthcheck.timeout', parseInt(e.target.value) * 1000000000)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Retries</label>
          <input
            type="number"
            {...register('healthcheck.retries')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="3"
          />
        </div>
      </div>
    </div>
  );
}
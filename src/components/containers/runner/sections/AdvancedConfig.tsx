import React from 'react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import type { ContainerRunConfig } from '../types';

interface AdvancedConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  watch: UseFormWatch<ContainerRunConfig>;
  errors: any;
}

export function AdvancedConfig({ register, watch, errors }: AdvancedConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Advanced Configuration</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">User</label>
          <input
            {...register('user')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx"
          />
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

        <div>
          <label className="block text-sm font-medium text-gray-700">Domain Name</label>
          <input
            {...register('domainname')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hostname</label>
          <input
            {...register('hostname')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., container1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Runtime Options</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('init')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Init Process</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('tty')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allocate TTY</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('stdinOpen')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Keep STDIN Open</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('readOnly')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Read Only Root FS</span>
          </label>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import type { ContainerRunConfig } from '../types';

interface BasicConfigProps {
  register: UseFormRegister<ContainerRunConfig>;
  errors: any;
  watch: UseFormWatch<ContainerRunConfig>;
}

export function BasicConfig({ register, errors, watch }: BasicConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Basic Configuration</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input
            {...register('image', { required: 'Image is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx:latest"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Command</label>
          <input
            {...register('command')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx -g 'daemon off;'"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Container Name</label>
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., my-nginx"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('detach')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Detach</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('autoRemove')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Auto Remove</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('privileged')}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Privileged</span>
          </label>
        </div>
      </div>
    </div>
  );
}
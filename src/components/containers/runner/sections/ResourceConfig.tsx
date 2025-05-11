import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import type { ContainerRunConfig } from '../types';

// This type represents just the resource configuration fields we're updating
type ResourceUpdateConfig = Pick<ContainerRunConfig, 'memory' | 'cpuShares' | 'memoryReservation' | 'memorySwap'>;

interface ResourceConfigProps {
  register: UseFormRegister<ResourceUpdateConfig>;
  errors: any;
}

export function ResourceConfig({ register, errors }: ResourceConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Resource Configuration</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">CPU Shares</label>
          <input
            type="number"
            {...register('cpuShares')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., 1024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Memory Limit</label>
          <input
            {...register('memory')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., 512m"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Memory Reservation</label>
          <input
            {...register('memoryReservation')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., 256m"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Memory Swap</label>
          <input
            {...register('memorySwap')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., 1g"
          />
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Play, Repeat, Settings } from 'lucide-react';

interface JobFormData {
  name: string;
  type: 'immediate' | 'delayed' | 'recurring';
  data: string;
  priority: number;
  delay?: number;
  cron?: string;
}

export function JobForm() {
  const { register, handleSubmit, watch } = useForm<JobFormData>();
  const jobType = watch('type');

  const onSubmit = (data: JobFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Job Name</label>
        <input
          {...register('name', { required: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter job name"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Job Type</label>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              {...register('type')}
              value="immediate"
              className="hidden"
            />
            <Play className="w-5 h-5 text-gray-500 mr-2" />
            <span>Immediate</span>
          </label>
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              {...register('type')}
              value="delayed"
              className="hidden"
            />
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span>Delayed</span>
          </label>
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              {...register('type')}
              value="recurring"
              className="hidden"
            />
            <Repeat className="w-5 h-5 text-gray-500 mr-2" />
            <span>Recurring</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Job Data (JSON)</label>
        <textarea
          {...register('data')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder='{"key": "value"}'
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <input
          type="number"
          {...register('priority')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1"
        />
      </div>

      {jobType === 'delayed' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Delay (ms)</label>
          <input
            type="number"
            {...register('delay')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5000"
          />
        </div>
      )}

      {jobType === 'recurring' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
          <input
            {...register('cron')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="* * * * *"
          />
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create Job
      </button>
    </form>
  );
}
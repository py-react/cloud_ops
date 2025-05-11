import React from 'react';
import { Play, Pause, RefreshCw, Trash2 } from 'lucide-react';
import type { Job } from 'src/types/job';
import { formatDistanceToNow } from 'date-fns';

interface JobListProps {
  jobs: Job[];
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function JobList({ jobs, onRetry, onDelete }: JobListProps) {
  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{job.name}</div>
                  <div className="text-sm text-gray-500">{job.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => onRetry?.(job.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                    {job.status === 'active' && (
                      <button className="text-yellow-600 hover:text-yellow-900">
                        <Pause className="w-5 h-5" />
                      </button>
                    )}
                    {job.status === 'waiting' && (
                      <button className="text-green-600 hover:text-green-900">
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete?.(job.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
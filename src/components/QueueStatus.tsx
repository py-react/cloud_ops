import React from 'react';
import { Activity, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { QueueMetrics } from 'src/types/job';

interface QueueStatusProps {
  metrics: QueueMetrics;
}

export function QueueStatus({ metrics }: QueueStatusProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          <h3 className="text-sm font-medium text-gray-700">Waiting</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{metrics.waiting}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-700">Active</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{metrics.active}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="text-sm font-medium text-gray-700">Completed</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{metrics.completed}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-medium text-gray-700">Failed</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold">{metrics.failed}</p>
      </div>
    </div>
  );
}
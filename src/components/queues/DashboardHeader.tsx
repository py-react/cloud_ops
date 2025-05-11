import React from 'react';
import { ListTreeIcon } from 'lucide-react';

export function DashboardHeader() {
  return (
    <div className="flex items-center space-x-4 mb-8">
      <ListTreeIcon className="w-8 h-8 text-blue-600" />
      <h1 className="text-3xl font-bold tracking-tight">Queues Manager</h1>
    </div>
  );
}
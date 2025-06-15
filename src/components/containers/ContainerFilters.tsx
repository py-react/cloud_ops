import React from 'react';
import { Search } from 'lucide-react';

interface ContainerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ContainerFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ContainerFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 px-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 
                   bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 
                   focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search containers..."
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                 rounded-md"
      >
        <option value="">All Status</option>
        <option value="running">Running</option>
        <option value="exited">Exited</option>
        <option value="paused">Paused</option>
        <option value="restarting">Restarting</option>
      </select>
    </div>
  );
}
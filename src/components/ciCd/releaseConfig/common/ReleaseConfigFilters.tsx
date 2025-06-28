import React from "react";
import { FileCog, Search } from "lucide-react";

interface ReleaseConfigFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  deleteFilter: string;
  onDeleteFilterChange: (value: string) => void;
}

export const ReleaseConfigFilters: React.FC<ReleaseConfigFiltersProps> = ({
  search,
  onSearchChange,
  deleteFilter,
  onDeleteFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 px-6 mb-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 \
                   bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 \
                   focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search by source control, deployment name, or labels..."
        />
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </span>
      </div>
      {/* Delete Filter */}
      <select
        value={deleteFilter}
        onChange={(e) => onDeleteFilterChange(e.target.value)}
        className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 \
                   focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm \
                   rounded-md"
      >
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="delete">Delete</option>
      </select>
    </div>
  );
}; 
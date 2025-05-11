import React from 'react';
import { ChevronLeft, Home, RefreshCw } from 'lucide-react';

interface FileExplorerHeaderProps {
  currentPath: string;
  onNavigateUp: () => void;
  onNavigateHome: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function FileExplorerHeader({
  currentPath,
  onNavigateUp,
  onNavigateHome,
  onRefresh,
  isLoading,
}: FileExplorerHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <button
          onClick={onNavigateUp}
          disabled={currentPath === '/'}
          className="p-1.5 text-gray-900 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go up"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNavigateHome}
          className="p-1.5 text-gray-900 rounded-md hover:bg-gray-100"
          title="Go to root"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-gray-900 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 mx-4">
        <div className="px-3 py-1.5 text-gray-900 bg-gray-50 rounded text-sm font-mono truncate">
          {currentPath}
        </div>
      </div>
    </div>
  );
}
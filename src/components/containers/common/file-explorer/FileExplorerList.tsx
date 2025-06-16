import React from 'react';
import { File, Folder } from 'lucide-react';
import type { FileSystemEntry } from '@/types/file-explorer';

interface FileExplorerListProps {
  entries: FileSystemEntry[];
  onNavigate: (entry: FileSystemEntry) => void;
  onSelect: (entry: FileSystemEntry) => void;
}

export function FileExplorerList({ entries, onNavigate, onSelect }: FileExplorerListProps) {
  return (
    <div className="overflow-y-auto flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
        {entries.map((entry) => (
          <button
            key={entry.name}
            onClick={() => {
              if( ["directory","symlink"].includes(entry.type)){
                onNavigate(entry)
                onSelect(null)
                return
              }
              onSelect(entry)
            }}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 text-left w-full"
          >
            {entry.type === 'directory' ? (
              <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
            ) : entry.type==="symlink" ? (
              <Folder className="w-5 h-5 text-gray-500 flex-shrink-0" />
            ) : (
              <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {entry.name}
              </div>
              {entry.size && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(entry.size)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
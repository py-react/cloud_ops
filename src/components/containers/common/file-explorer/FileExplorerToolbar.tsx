import React from 'react';
import { Upload, Download, Trash2, TerminalIcon } from 'lucide-react';
import type { FileSystemEntry } from '@/types/file-explorer';

interface FileExplorerToolbarProps {
  selectedEntry?: FileSystemEntry;
  onUpload: () => void;
  onDownload: (entry: FileSystemEntry) => void;
  onDelete: (entry: FileSystemEntry) => void;
  handleAttachment: () => void;
}

export function FileExplorerToolbar({
  selectedEntry,
  onUpload,
  onDownload,
  onDelete,
  handleAttachment,
}: FileExplorerToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
      <div className="flex items-center space-x-2">
        <button
          onClick={onUpload}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
        <button
          onClick={handleAttachment}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border hover:bg-gray-50"
        >
          <TerminalIcon className="w-4 h-4" />
          <span>Attach</span>
        </button>
      </div>
      
      {selectedEntry && (
        <div className="flex items-center space-x-2">
          {selectedEntry.type === 'file' && (
            <button
              onClick={() => onDownload(selectedEntry)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
          <button
            onClick={() => onDelete(selectedEntry)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-white rounded-md border border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
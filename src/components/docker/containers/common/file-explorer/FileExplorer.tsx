import React from 'react';
import { FileExplorerHeader } from './FileExplorerHeader';
import { FileExplorerList } from './FileExplorerList';
import { FileExplorerToolbar } from './FileExplorerToolbar';
import { useFileExplorer } from '../../hooks/useFileExplorer';
import type { FileSystemEntry } from '@/types/file-explorer';

interface FileExplorerProps {
  containerId: string;
  attachTerminalToPath:(action: "attach" | "set",path?: string) => void
  currentPath?:string
}

export function FileExplorer({ containerId,attachTerminalToPath,currentPath }: FileExplorerProps) {
  const {
    state,
    selectedEntry,
    setSelectedEntry,
    fetchDirectory,
    navigateUp,
    navigateToDirectory,
    
  } = useFileExplorer(containerId,attachTerminalToPath);

  React.useEffect(() => {
    fetchDirectory(currentPath||"/");
  }, [fetchDirectory,currentPath]);

  const handleUpload = () => {
    // TODO: Implement file upload
    console.log('Upload file');
  };

  const handleDownload = (entry: FileSystemEntry) => {
    // TODO: Implement file download
    console.log('Download file:', entry.name);
  };

  const handleDelete = (entry: FileSystemEntry) => {
    // TODO: Implement file/directory deletion
    console.log('Delete:', entry.name);
  };

  const handleAttachment = () => {
    attachTerminalToPath("attach")
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      <FileExplorerHeader
        currentPath={state.currentPath}
        onNavigateUp={navigateUp}
        onNavigateHome={() => fetchDirectory('/')}
        onRefresh={() => fetchDirectory(state.currentPath)}
        isLoading={state.isLoading}
      />

      {state.error ? (
        <div className="flex-1 flex items-center justify-center p-4 text-red-600">
          {state.error}
        </div>
      ) : (
        <FileExplorerList
          entries={state.entries}
          onNavigate={navigateToDirectory}
          onSelect={setSelectedEntry}
        />
      )}

      <FileExplorerToolbar
        selectedEntry={selectedEntry}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onDelete={handleDelete}
        handleAttachment={handleAttachment}
      />
    </div>
  );
}
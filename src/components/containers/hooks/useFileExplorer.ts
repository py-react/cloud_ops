import { useState, useCallback } from 'react';
import type { FileExplorerState,FileSystemEntry, FileExplorerCommand } from '@/types/file-explorer';

export function useFileExplorer(containerId: string,attachTerminalToPath:(action: "attach" | "set",path?: string) => void) {
  const [state, setState] = useState<FileExplorerState>({
    currentPath: "/",
    entries: [],
    isLoading: true,
  });
  
  const [selectedEntry, setSelectedEntry] = useState<FileSystemEntry>();

  const fetchDirectory = useCallback(async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const command: FileExplorerCommand = {
        action: 'files',
        containerId,
        dir: {
          command: `ls -la ${path}`,
          directory: path,
        },
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch directory contents');
      }

      const data = (await response.json()).files;
      const entries = parseListOutput(data);
      console.log({entries})
      
      setState(prev => ({
        ...prev,
        currentPath: path,
        entries,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [containerId]);

  const navigateUp = useCallback(() => {
    if (state.currentPath === '/') return;
    const parentPath = state.currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchDirectory(parentPath);
    attachTerminalToPath("set",parentPath)
  }, [state.currentPath, fetchDirectory]);

  const navigateToDirectory = useCallback((entry: FileSystemEntry) => {
    if (!["directory","symlink"].includes(entry.type)) return;
    const newPath = state.currentPath === '/' 
      ? `/${entry.target?entry.target:entry.name}`
      : `${state.currentPath}/${entry.target?entry.target:entry.name}`;
    fetchDirectory(newPath);
    attachTerminalToPath("set",newPath)
  }, [state.currentPath, fetchDirectory]);

  return {
    state,
    selectedEntry,
    setSelectedEntry,
    fetchDirectory,
    navigateUp,
    navigateToDirectory,
  };
}

function parseListOutput(output: string): FileSystemEntry[] {
  // Simple parser for ls -la output
  return output
    .split('\n')
    .filter(line => line && !line.startsWith('total'))
    .map(line => {
      const parts = line.split(/\s+/);
      const name = parts.slice(8).join(' ');
      const isDirectory = line.startsWith('d');
      const isSymlink = line.startsWith('l');

      let target: string | undefined;
      if (isSymlink) {
        // The last part (after the '->') is the target of the symlink
        target = parts.slice(-1)[0].replace(/^->\s*/, '');
      }
      
      return {
        name,
        type: isDirectory ? 'directory' : isSymlink?"symlink":'file',
        size: parseInt(parts[4], 10),
        permissions: parts[0],
        modified: `${parts[5]} ${parts[6]} ${parts[7]}`,
        target
      };
    });
}

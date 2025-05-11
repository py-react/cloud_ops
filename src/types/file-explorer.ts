export interface ExecCommandOptions {
    stdout?: boolean;
    stderr?: boolean;
    stdin?: boolean;
    tty?: boolean;
    privileged?: boolean;
    user?: string;
    detach?: boolean;
    stream?: boolean;
    socket?: boolean;
    environment?: Record<string, string>;
    workdir?: string;
    demux?: boolean;
  }
  
  export interface FileExplorerCommand {
    action: 'command'|'files';
    containerId: string;
    dir: {
      command: string;
      directory: string;
    };
  }
  
  export interface FileSystemEntry {
    name: string;
    type: 'file' | 'directory' |'symlink';
    size?: number;
    modified?: string;
    permissions?: string;
    target?:string
  }
  
  export interface FileExplorerState {
    currentPath: string;
    entries: FileSystemEntry[];
    isLoading: boolean;
    error?: string;
  }
export interface ISystemInfo {
    ID: string
    Containers: number
    ContainersRunning: number
    ContainersPaused: number
    ContainersStopped: number
    Images: number
    Driver: string
    DriverStatus: [string, string][]
    Plugins: {
      Volume: string[]
      Network: string[]
      Log: string[]
    }
    MemoryLimit: boolean
    SwapLimit: boolean
    KernelVersion: string
    OperatingSystem: string
    OSType: string
    Architecture: string
    NCPU: number
    MemTotal: number
    DockerRootDir: string
    HttpProxy: string
    HttpsProxy: string
    NoProxy: string
    Name: string
    ServerVersion: string
    Runtimes: {
      [key: string]: { path: string }
    }
    DefaultRuntime: string
    Swarm: {
      NodeID: string
      NodeAddr: string
      LocalNodeState: string
    }
    SecurityOptions: string[]
    system_stats:{
      network:{
        total_bytes_sent:string
        total_bytes_recv:string
      }
      memory:{
        total_memory_usage:number
        total_memory_allocated:number
        total_memory_allocated_docker:number
      }
    }
  }
// Types for container configuration
export interface ContainerRunConfig {
  // Required Configuration
  image: string;
  
  // Optional Basic Configuration
  name?: string;
  command?: string;
  entrypoint?: string;
  workingDir?: string;
  user?: string;
  
  // Runtime Configuration
  detach?: boolean;
  tty?: boolean;
  stdinOpen?: boolean;
  removeOnExit?: boolean;
  privileged?: boolean;
  init?: boolean;
  
  // Resource Configuration
  cpuPeriod?: number;
  cpuQuota?: number;
  cpuShares?: string;
  cpusetCpus?: string;
  cpusetMems?: string;
  memory?: string;
  memoryReservation?: string;
  memorySwap?: string;
  memorySwappiness?: number;
  nanoCpus?: number;
  oomKillDisable?: boolean;
  pidsLimit?: number;
  
  // Network Configuration
  hostname?: string;
  domainname?: string;
  networkMode?: 'bridge' | 'host' | 'none' | string;
  ports?: Record<string, PortMapping>;
  expose?: string[];
  dns?: string[];
  dnsSearch?: string[];
  extraHosts?: Record<string, string>;
  networkDisabled?: boolean;
  
  // Storage Configuration
  volumes?: VolumeMount[];
  tmpfs?: Record<string, string>;
  mounts?: Mount[];
  readOnly?: boolean;
  storageOpt?: Record<string, string>;
  
  // Environment Configuration
  environment?: Record<string, string>;
  envFiles?: string[];
  labels?: Record<string, string>;
  
  // Health Check Configuration
  healthcheck?: HealthcheckConfig;
  
  // Security Configuration
  securityOpt?: string[];
  capAdd?: string[];
  capDrop?: string[];
  groupAdd?: string[];
  userns?: string;
  
  // Logging Configuration
  logConfig?: LogConfig;
  
  // Restart Policy
  restartPolicy?: RestartPolicy;
}

export interface PortMapping {
  hostIp?: string;
  hostPort?: number;
  containerPort: number;
  protocol: 'tcp' | 'udp' | 'sctp';
}

export interface VolumeMount {
  source: string;
  target: string;
  mode: 'rw' | 'ro';
  type?: 'bind' | 'volume' | 'tmpfs';
  readonly?: boolean;
}

export interface Mount {
  type: 'bind' | 'volume' | 'tmpfs';
  source: string;
  target: string;
  readonly?: boolean;
  bindOptions?: {
    propagation: 'private' | 'rprivate' | 'shared' | 'rshared' | 'slave' | 'rslave';
  };
  volumeOptions?: {
    noCopy: boolean;
    labels: Record<string, string>;
    driverConfig: {
      name: string;
      options: Record<string, string>;
    };
  };
  tmpfsOptions?: {
    sizeBytes: number;
    mode: number;
  };
}

export interface HealthcheckConfig {
  test: string[];
  interval: number;
  timeout: number;
  retries: number;
  startPeriod: number;
}

export interface LogConfig {
  type: 'json-file' | 'syslog' | 'journald' | 'gelf' | 'fluentd' | 'awslogs' | 'splunk' | 'etwlogs' | 'none';
  config: Record<string, string>;
}

export interface RestartPolicy {
  name: 'no' | 'on-failure' | 'always' | 'unless-stopped';
  maximumRetryCount?: number;
}
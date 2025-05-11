import type { ContainerInfo } from "@/gingerJs_api_client";

export interface ContainerState {
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
}

export interface ContainerVolume {
  Source: string;
  Destination: string;
}

export interface PortMapping {
  HostPort: string;
}

export interface ContainerPorts {
  [key: string]: PortMapping[];
}

export interface Container extends ContainerInfo {
  
}
export interface StorageInfo {
  name: string; // Volume name (e.g., explore_dragonflydata)
  driver: string; // Driver used by the volume (e.g., local)
  labels: { [key: string]: string }; // Labels associated with the volume
  options: string | null; // Options (if any, otherwise null)
  mountPoint: string; // Path where the volume is mounted
  created: string; // Volume creation date (timestamp as string)
  scope: string; // Scope of the volume (e.g., local)
  inUse: boolean; // Whether the volume is in use by any container
}

export interface CreateStorageParams {
  name?: string;
  driver?: string;
  driverOpts?: Record<string, string>;
  labels?: Record<string, string>;
}
export interface PackageInfo {
    id: string; // Image ID (e.g., sha256:<hash>)
    name:string;
    tags: string[]; // Tags associated with the image (e.g., ["latest", "v1.0"])
    created: string; // Image creation date (timestamp as string)
    size: number; // Size of the image in bytes
    virtual_size: number; // Size of the image in bytes
    repoTags: string[]; // Repository tags (like [<repo>:<tag>])
    parentId?: string; // Parent image ID if this is a child image, otherwise undefined
    layers: string[]; // Layer IDs or paths for image layers
  }
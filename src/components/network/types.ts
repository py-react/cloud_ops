export interface Network {
    Name: string;
    Id: string;
    Created: string;
    Scope: string;
    Driver: string;
    EnableIPv6: boolean;
    IPAM: {
      Driver: string;
      Options: null | Record<string, string>;
      Config: Array<{
        Subnet: string;
        Gateway: string;
      }>;
    };
    Internal: boolean;
    Attachable: boolean;
    Ingress: boolean;
    ConfigFrom: {
      Network: string;
    };
    ConfigOnly: boolean;
    Containers: Record<string, unknown>;
    Options: Record<string, string>;
    Labels: Record<string, string>;
  }
export interface Network {
  Id: string;
  Name: string;
  Created: string;
  Scope: string;
  Driver: string;
  EnableIPv6?: boolean;
  IPAM?: {
    Driver: string;
    Config: Array<Record<string, string>>;
  };
  Internal?: boolean;
  Attachable?: boolean;
  Ingress?: boolean;
  Options?: Record<string, string>;
  Labels?: Record<string, string>;
}
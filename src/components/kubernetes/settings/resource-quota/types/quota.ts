
export interface IResourceQuota {
  name: string;
  namespace: string;
  spec: {
    hard: Record<string, string>;
    scope_selector?: any;
    scopes?: any;
  };
  status: {
    hard: Record<string, string>;
    used: Record<string, string>;
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
  creation_timestamp: string;
  last_applied: Record<string, any>;
}

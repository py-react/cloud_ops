import * as z from "zod";

// Define schema for resource quota settings
export const quotaSchema = z.object({
  // Quota name (single quota approach)
  quotaName: z.string().default("resource-quota"),
  quotaNamespace: z.string().default("default"),
  
  // Compute resource quotas
  computeQuota: z.boolean().default(false),
  limitsCpu: z.string().optional(),
  limitsMemory: z.string().optional(),
  requestsCpu: z.string().optional(),
  requestsMemory: z.string().optional(),
  hugepages: z.string().optional(),
  
  // Storage resource quotas
  storageQuota: z.boolean().default(false),
  requestsStorage: z.string().optional(),
  persistentvolumeclaims: z.string().optional(),
  storageClasses: z.array(z.object({
    name: z.string(),
    storage: z.string().optional(),
    claims: z.string().optional(),
  })).default([]),
  
  // Object count quotas
  objectQuota: z.boolean().default(false),
  pods: z.string().optional(),
  configmaps: z.string().optional(),
  secrets: z.string().optional(),
  services: z.string().optional(),
  servicesLoadBalancers: z.string().optional(),
  servicesNodePorts: z.string().optional(),
  replicationcontrollers: z.string().optional(),
  resourcequotas: z.string().optional(),
  
  // Additional object counts (using count/<resource>.<group> syntax)
  customObjectCounts: z.array(z.object({
    resource: z.string(),
    count: z.string(),
  })).default([]),
  
  // Quota scopes
  enableScopes: z.boolean().default(false),
  scopeSelector: z.object({
    terminating: z.boolean().default(false),
    notTerminating: z.boolean().default(false),
    bestEffort: z.boolean().default(false),
    notBestEffort: z.boolean().default(false),
    crossNamespacePodAffinity: z.boolean().default(false),
  }).default({}),
  
  // Priority class quotas
  priorityClassQuota: z.boolean().default(false),
  priorityClasses: z.array(z.object({
    name: z.string(),
    cpu: z.string().optional(),
    memory: z.string().optional(),
    pods: z.string().optional(),
  })).default([]),
  
  // Volume attributes class quotas
  volumeAttributesClassQuota: z.boolean().default(false),
  volumeAttributesClasses: z.array(z.object({
    name: z.string(),
    storage: z.string().optional(),
    claims: z.string().optional(),
  })).default([]),
  
  // Raw YAML for advanced configurations
  enableRawYaml: z.boolean().default(false),
  rawYaml: z.string().optional(),
});

export type QuotaFormValues = z.infer<typeof quotaSchema>;

export interface ResourceQuota {
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
}

export interface NamespaceSettingsModalProps {
  quotaName: string;
  quota: ResourceQuota;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}
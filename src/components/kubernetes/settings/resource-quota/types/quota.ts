import * as z from "zod";

// Define schema for resource quota settings
export const quotaSchema = z.object({
  rawYaml: z.string({required_error:"Please provide YAML configuration!",message:"Invalid YAML configuration"}).min(10,"Invalid YAML configuration"),
});

export type QuotaFormValues = z.infer<typeof quotaSchema>;

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

export interface IResourceQuotaForm {
  editDetails:boolean;
  quotaName: string;
  quota: IResourceQuota;
  onClose: () => void;
  onUpdate: (data: any) => void;
}
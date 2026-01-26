import { UseFormReturn } from "react-hook-form";
import * as z from 'zod';
import { DeploymentConfigType } from "@/gingerJs_api_client/models/DeploymentConfigType";
import { ContainerConfig } from "@/gingerJs_api_client/models/ContainerConfig";
import { K8sVolume } from "@/gingerJs_api_client/models/K8sVolume";
import { K8sAffinity } from "@/gingerJs_api_client/models/K8sAffinity";
import { ServicePortConfig } from "@/gingerJs_api_client/models/ServicePortConfig";

export interface ExtendedContainerConfig extends ContainerConfig {
}

export interface DeploymentFormData extends Omit<DeploymentConfigType, 'node_selector' | 'containers'> {
  node_selector?: Record<string, string> | null;
  containers: ExtendedContainerConfig[];
}

export const releaseFormSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  namespace: z.string().min(1, 'Namespace is required'),
  deployment_name: z.string().min(1, 'Deployment name is required'),
  tag: z.string().min(1, 'Tag is required'),
  code_source_control_name: z.string().min(1, 'Source control name is required'),
  deployment_strategy_id: z.number(),
  replicas: z.number().min(0).default(1),

  // NEW: Reusable Profile IDs
  container_profile_ids: z.array(z.number()).optional().nullable(),
  volume_profile_ids: z.array(z.number()).optional().nullable(),
  scheduling_profile_id: z.number().optional().nullable(),

  // Legacy: Direct embedded config (now optional)
  containers: z.array(z.object({
    name: z.string().min(1, 'Container name is required'),
    image: z.string().optional(),
    env: z.array(z.any()).optional().nullable(),
    ports: z.array(z.any()).optional().nullable(),
    resources: z.object({
      requests: z.record(z.string()).optional(),
      limits: z.record(z.string()).optional(),
    }).optional().nullable(),
  })).optional().nullable(),
  service_ports: z.array(z.object({
    port: z.number(),
    target_port: z.number(),
    protocol: z.enum(["TCP", "UDP", "SCTP"]),
  })).optional().nullable(),
  labels: z.record(z.string()).optional().nullable(),
  annotations: z.record(z.string()).optional().nullable(),
  node_selector: z.record(z.string()).optional().nullable(),
  tolerations: z.array(z.any()).optional().nullable(),
  affinity: z.any().optional().nullable(),
  volumes: z.array(z.any()).optional().nullable(),
});

// Type guards for affinity components
export const hasNodeAffinity = (affinity: K8sAffinity | null | undefined): affinity is K8sAffinity & { nodeAffinity: NonNullable<K8sAffinity['nodeAffinity']> } =>
  !!affinity && typeof affinity === "object" && !!affinity.nodeAffinity;

export const hasPodAffinity = (affinity: K8sAffinity | null | undefined): affinity is K8sAffinity & { podAffinity: NonNullable<K8sAffinity['podAffinity']> } =>
  !!affinity && typeof affinity === "object" && !!affinity.podAffinity;

export const hasPodAntiAffinity = (affinity: K8sAffinity | null | undefined): affinity is K8sAffinity & { podAntiAffinity: NonNullable<K8sAffinity['podAntiAffinity']> } =>
  !!affinity && typeof affinity === "object" && !!affinity.podAntiAffinity;

// Helper for updating NodeAffinity
export function updateNodeAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (nodeAffinity: NonNullable<K8sAffinity['nodeAffinity']>) => void
) {
  const affinity = form.getValues("affinity");
  if (hasNodeAffinity(affinity)) {
    const newAffinity = JSON.parse(JSON.stringify(affinity)); // Deep clone to be safe
    updater(newAffinity.nodeAffinity);
    form.setValue("affinity", newAffinity);
  }
}

// Helper for updating PodAffinity
export function updatePodAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (podAffinity: NonNullable<K8sAffinity['podAffinity']>) => void
) {
  const affinity = form.getValues("affinity");
  if (hasPodAffinity(affinity)) {
    const newAffinity = JSON.parse(JSON.stringify(affinity));
    updater(newAffinity.podAffinity);
    form.setValue("affinity", newAffinity);
  }
}

// Helper for updating PodAntiAffinity
export function updatePodAntiAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (podAntiAffinity: NonNullable<K8sAffinity['podAntiAffinity']>) => void
) {
  const affinity = form.getValues("affinity");
  if (hasPodAntiAffinity(affinity)) {
    const newAffinity = JSON.parse(JSON.stringify(affinity));
    updater(newAffinity.podAntiAffinity);
    form.setValue("affinity", newAffinity);
  }
}

// Key-value pair utilities
export const getNextPlaceholderKey = (obj: Record<string, string>, base: string = "__new"): string => {
  let i = 1;
  let key = base + i;
  while (obj.hasOwnProperty(key)) {
    i++;
    key = base + i;
  }
  return key;
};

export const addKeyValuePair = (
  form: UseFormReturn<DeploymentFormData>,
  type: "labels" | "annotations" | "node_selector"
) => {
  const currentObj = form.getValues(type) || {};
  let newKey = "";
  if (currentObj.hasOwnProperty("")) {
    newKey = getNextPlaceholderKey(currentObj);
  }
  form.setValue(type, { ...currentObj, [newKey]: "" });
};

export const updateKeyValuePair = (
  form: UseFormReturn<DeploymentFormData>,
  type: "labels" | "annotations" | "node_selector",
  oldKey: string,
  newKey: string,
  value: string
) => {
  const currentObj = form.getValues(type) || {};
  const newObj = { ...currentObj };
  if (oldKey !== newKey) {
    delete newObj[oldKey];
  }
  newObj[newKey] = value;
  form.setValue(type, newObj);
};

export const removeKeyValuePair = (
  form: UseFormReturn<DeploymentFormData>,
  type: "labels" | "annotations" | "node_selector",
  key: string
) => {
  const currentObj = form.getValues(type) || {};
  const newObj = { ...currentObj };
  delete newObj[key];
  form.setValue(type, newObj);
};

// Affinity type utilities
export const getAffinityType = (affinity: K8sAffinity | null | undefined): string => {
  if (!affinity) return 'none';
  if (hasNodeAffinity(affinity)) return 'nodeAffinity';
  if (hasPodAffinity(affinity)) return 'podAffinity';
  if (hasPodAntiAffinity(affinity)) return 'podAntiAffinity';
  return 'none';
};

export const updateAffinityType = (form: UseFormReturn<DeploymentFormData>, type: string) => {
  let newAffinity: K8sAffinity | undefined;
  switch (type) {
    case 'nodeAffinity':
      newAffinity = {
        nodeAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: []
          },
          preferredDuringSchedulingIgnoredDuringExecution: []
        }
      };
      break;
    case 'podAffinity':
      newAffinity = {
        podAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: [],
          preferredDuringSchedulingIgnoredDuringExecution: []
        }
      };
      break;
    case 'podAntiAffinity':
      newAffinity = {
        podAntiAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: [],
          preferredDuringSchedulingIgnoredDuringExecution: []
        }
      };
      break;
    default:
      newAffinity = undefined;
  }
  form.setValue("affinity", newAffinity);
};

// Volume utilities
export const getVolumeType = (volume: K8sVolume): string => {
  if ('configMap' in volume) return 'configMap';
  if ('secret' in volume) return 'secret';
  if ('emptyDir' in volume) return 'emptyDir';
  if ('persistentVolumeClaim' in volume) return 'persistentVolumeClaim';
  return 'emptyDir'; // default
};

export const updateVolumeType = (form: UseFormReturn<DeploymentFormData>, index: number, type: string) => {
  const currentVolumes = form.getValues("volumes") || [];
  const volumeName = currentVolumes[index]?.name || "";

  let newVolume: K8sVolume;
  switch (type) {
    case 'configMap':
      newVolume = {
        name: volumeName,
        configMap: { name: "" }
      };
      break;
    case 'secret':
      newVolume = {
        name: volumeName,
        secret: { secretName: "" }
      };
      break;
    case 'persistentVolumeClaim':
      newVolume = {
        name: volumeName,
        persistentVolumeClaim: { claimName: "" }
      };
      break;
    default:
      newVolume = {
        name: volumeName,
        emptyDir: {}
      };
  }

  currentVolumes[index] = newVolume;
  form.setValue("volumes", currentVolumes);
}; 
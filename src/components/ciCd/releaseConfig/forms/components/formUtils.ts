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
  deployment_name: z.string().min(1, 'Release config name is required'),
  type: z.string().min(1, 'Type is required'),
  required_source_control: z.boolean().default(false),
  code_source_control_name: z.string().optional().nullable(),
  source_control_branch: z.string().optional().nullable(),
  derived_deployment_id: z.number().nullable().optional(),
  namespace: z.string().min(1, 'Namespace is required'),
}).refine((data) => {
  // Ensure derived_deployment_id is selected
  if (!data.derived_deployment_id || data.derived_deployment_id === 0) {
    return false;
  }
  return true;
}, {
  message: 'Derived deployment is required',
  path: ['derived_deployment_id'],
}).refine((data) => {
  // If required_source_control is true, then code_source_control_name and branch must be provided
  if (data.required_source_control) {
    const hasRepo = !!data.code_source_control_name && data.code_source_control_name.length > 0;
    const hasBranch = !!data.source_control_branch && data.source_control_branch.length > 0;
    return hasRepo && hasBranch;
  }
  return true;
}, {
  message: 'Source control and branch are required when "Required Source Control" is enabled',
  path: ['code_source_control_name'],
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
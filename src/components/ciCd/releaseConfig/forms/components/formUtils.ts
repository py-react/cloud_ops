import { UseFormReturn } from "react-hook-form";
import { K8sAffinity, K8sVolume } from "../type";

export interface DeploymentFormData {
  type: string;
  namespace: string;
  deployment_name: string;
  tag: string;
  code_source_control_name: string;
  deployment_strategy_id: number;
  replicas: number;
  containers: any[];
  service_ports: any[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  nodeSelector?: Record<string, string>;
  tolerations?: any[];
  affinity?: K8sAffinity;
  volumes?: K8sVolume[];
}

// Type guards for affinity
export const isNodeAffinity = (affinity: K8sAffinity | undefined): affinity is Extract<K8sAffinity, { nodeAffinity: any }> =>
  !!affinity && "nodeAffinity" in affinity;

export const isPodAffinity = (affinity: K8sAffinity | undefined): affinity is Extract<K8sAffinity, { podAffinity: any }> =>
  !!affinity && "podAffinity" in affinity;

export const isPodAntiAffinity = (affinity: K8sAffinity | undefined): affinity is Extract<K8sAffinity, { podAntiAffinity: any }> =>
  !!affinity && "podAntiAffinity" in affinity;

// Helper for updating NodeAffinity
export function updateNodeAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (nodeAffinity: NonNullable<K8sAffinity & { nodeAffinity: any }>['nodeAffinity']) => void
) {
  const formData = form.watch();
  if (isNodeAffinity(formData.affinity)) {
    const newAffinity = { ...formData.affinity } as Extract<K8sAffinity, { nodeAffinity: any }>;
    updater(newAffinity.nodeAffinity);
    form.setValue("affinity", newAffinity);
  }
}

// Helper for updating PodAffinity
export function updatePodAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (podAffinity: NonNullable<K8sAffinity & { podAffinity: any }>['podAffinity']) => void
) {
  const formData = form.watch();
  if (isPodAffinity(formData.affinity)) {
    const newAffinity = { ...formData.affinity } as Extract<K8sAffinity, { podAffinity: any }>;
    updater(newAffinity.podAffinity);
    form.setValue("affinity", newAffinity);
  }
}

// Helper for updating PodAntiAffinity
export function updatePodAntiAffinityTerm(
  form: UseFormReturn<DeploymentFormData>,
  updater: (podAntiAffinity: NonNullable<K8sAffinity & { podAntiAffinity: any }>['podAntiAffinity']) => void
) {
  const formData = form.watch();
  if (isPodAntiAffinity(formData.affinity)) {
    const newAffinity = { ...formData.affinity } as Extract<K8sAffinity, { podAntiAffinity: any }>;
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
  type: "labels" | "annotations" | "nodeSelector"
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
  type: "labels" | "annotations" | "nodeSelector",
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
  type: "labels" | "annotations" | "nodeSelector",
  key: string
) => {
  const currentObj = form.getValues(type) || {};
  const newObj = { ...currentObj };
  delete newObj[key];
  form.setValue(type, newObj);
};

// Affinity type utilities
export const getAffinityType = (affinity: K8sAffinity | undefined): string => {
  if (!affinity) return 'none';
  if (isNodeAffinity(affinity)) return 'nodeAffinity';
  if (isPodAffinity(affinity)) return 'podAffinity';
  if (isPodAntiAffinity(affinity)) return 'podAntiAffinity';
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
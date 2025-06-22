import { Control, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

export interface ContainerPort {
  name?: string;
  containerPort: number;
  protocol?: string;
}

export interface Container {
  name: string;
  image: string;
  ports?: ContainerPort[];
  env?: { name: string; value: string }[];
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
  command?: string[];
  args?: string[];
}

export interface PodTemplateMetadata {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface PodSpec {
  containers: Container[];
  restartPolicy?: string;
  terminationGracePeriodSeconds?: number;
}

export interface PodTemplateSpec {
  metadata?: PodTemplateMetadata;
  spec: PodSpec;
}

export interface Selector {
  matchLabels?: Record<string, string>;
}

export interface DeploymentSpec {
  replicas?: number;
  selector?: Selector;
  template: PodTemplateSpec;
  strategy?: {
    type?: string;
    rollingUpdate?: {
      maxSurge?: string | number;
      maxUnavailable?: string | number;
    };
  };
}

export interface Label {
  key: string;
  value: string;
}

export interface Annotation {
  key: string;
  value: string;
}

export interface Metadata {
  name: string;
  namespace?: string;
  labels?: Label[];
  annotations?: Annotation[];
}

export interface DeploymentFormData {
  metadata: Metadata;
  spec: DeploymentSpec;
}

export interface SectionProps {
  control: Control<DeploymentFormData>;
  errors: FieldErrors<DeploymentFormData>;
  watch: UseFormWatch<DeploymentFormData>;
  setValue?: UseFormSetValue<DeploymentFormData>;
} 
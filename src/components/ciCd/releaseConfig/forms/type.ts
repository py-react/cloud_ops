// K8S Container
type ExecProbe = {
  exec: { command: string[] };
  httpGet?: never;
  tcpSocket?: never;
};

type HttpGetProbe = {
  httpGet: {
    path: string;
    port: number | string;
    host?: string;
    scheme?: "HTTP" | "HTTPS";
    httpHeaders?: { name: string; value: string }[];
  };
  exec?: never;
  tcpSocket?: never;
};

type TcpSocketProbe = {
  tcpSocket: {
    port: number | string;
  };
  exec?: never;
  httpGet?: never;
};

type ProbeCommon = {
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
};

export type K8sProbe = (ExecProbe | HttpGetProbe | TcpSocketProbe) & ProbeCommon;

export interface K8sContainer {
  name: string;
  imagePullPolicy?: "Always" | "IfNotPresent" | "Never";
  command?: string[];
  args?: string[];
  workingDir?: string;

  ports?: Array<{
    name?: string;
    containerPort: number;
    protocol?: "TCP" | "UDP" | "SCTP";
  }>;

  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: {
      secretKeyRef?: {
        name: string;
        key: string;
        optional?: boolean;
      };
      configMapKeyRef?: {
        name: string;
        key: string;
        optional?: boolean;
      };
      fieldRef?: {
        fieldPath: string;
      };
      resourceFieldRef?: {
        resource: string;
        containerName?: string;
        divisor?: string;
      };
    };
  }>;

  envFrom?: Array<{
    configMapRef?: {
      name: string;
      optional?: boolean;
    };
    secretRef?: {
      name: string;
      optional?: boolean;
    };
    prefix?: string;
  }>;

  volumeMounts?: Array<{
    name: string;
    mountPath: string;
    readOnly?: boolean;
    subPath?: string;
  }>;

  resources?: {
    limits?: {
      cpu?: string;
      memory?: string;
    };
    requests?: {
      cpu?: string;
      memory?: string;
    };
  };

  livenessProbe?: K8sProbe;
  readinessProbe?: K8sProbe;
  startupProbe?: K8sProbe;

  lifecycle?: {
    postStart?: {
      exec?: { command: string[] };
      httpGet?: { path: string; port: number | string; scheme?: string };
      tcpSocket?: { port: number | string };
    };
    preStop?: {
      exec?: { command: string[] };
      httpGet?: { path: string; port: number | string; scheme?: string };
      tcpSocket?: { port: number | string };
    };
  };

  terminationMessagePath?: string;
  terminationMessagePolicy?: "File" | "FallbackToLogsOnError";

  securityContext?: {
    runAsUser?: number;
    runAsNonRoot?: boolean;
    allowPrivilegeEscalation?: boolean;
    privileged?: boolean;
    readOnlyRootFilesystem?: boolean;
    capabilities?: {
      add?: string[];
      drop?: string[];
    };
  };

  stdin?: boolean;
  stdinOnce?: boolean;
  tty?: boolean;
}

// K8S Volume
export type K8sVolume =
  | K8sConfigMapVolume
  | K8sSecretVolume
  | K8sEmptyDirVolume
  | K8sPersistentVolumeClaimVolume;

export interface K8sBaseVolume {
  name: string;
}

export interface K8sConfigMapVolume extends K8sBaseVolume {
  configMap: {
    name: string;
    items?: Array<{ key: string; path: string }>;
    defaultMode?: number;
    optional?: boolean;
  };
}

export interface K8sSecretVolume extends K8sBaseVolume {
  secret: {
    secretName: string;
    items?: Array<{ key: string; path: string }>;
    defaultMode?: number;
    optional?: boolean;
  };
}

export interface K8sEmptyDirVolume extends K8sBaseVolume {
  emptyDir: {
    medium?: string; // "" | "Memory"
    sizeLimit?: string;
  };
}

export interface K8sPersistentVolumeClaimVolume extends K8sBaseVolume {
  persistentVolumeClaim: {
    claimName: string;
    readOnly?: boolean;
  };
}

// K8sToleration
export interface K8sToleration {
  key?: string;
  operator?: "Exists" | "Equal";
  value?: string;
  effect?: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
  tolerationSeconds?: number;
}
// K8sAffinity
// Common selector structure
type LabelSelector = {
  matchLabels?: { [key: string]: string };
  matchExpressions?: Array<{
    key: string;
    operator: "In" | "NotIn" | "Exists" | "DoesNotExist";
    values?: string[];
  }>;
};

export type K8sAffinityOperator = "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";

export type K8sAffinity = {
  podAffinity?: {
    requiredDuringSchedulingIgnoredDuringExecution?: Array<{
      labelSelector?: LabelSelector;
      topologyKey: string;
      namespaces?: string[];
    }>;
    preferredDuringSchedulingIgnoredDuringExecution?: Array<{
      weight: number;
      podAffinityTerm: {
        labelSelector?: LabelSelector;
        topologyKey: string;
        namespaces?: string[];
      };
    }>;
  };
  podAntiAffinity?:K8sAffinity["podAffinity"];
  nodeAffinity?: {
    requiredDuringSchedulingIgnoredDuringExecution?: {
      nodeSelectorTerms: Array<{
        matchExpressions?: Array<{
          key: string;
          operator: K8sAffinityOperator
          values?: string[];
        }>;
        matchFields?: Array<{
          key: string;
          operator: K8sAffinityOperator
          values?: string[];
        }>;
      }>;
    };
    preferredDuringSchedulingIgnoredDuringExecution?: Array<{
      weight: number;
      preference: {
        matchExpressions?: Array<{
          key: string;
          operator: K8sAffinityOperator
          values?: string[];
        }>;
        matchFields?: Array<{
          key: string;
          operator: K8sAffinityOperator
          values?: string[];
        }>;
      };
    }>;
  };
};

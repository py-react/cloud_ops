import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Server,
  Container,
  Settings,
  Network,
  Tag,
  Key,
  FileText,
  HelpCircle,
  Layout,
  Globe,
  Cpu,
  LucideProps,
  HardDrive,
  Users,
} from "lucide-react";
import { 
  K8sAffinity, 
  K8sContainer, 
  K8sToleration, 
  K8sVolume,
  K8sEmptyDirVolume,
  K8sConfigMapVolume,
  K8sSecretVolume,
  K8sPersistentVolumeClaimVolume
} from "./type";

import BasicConfiguration from "./components/BasicConfiguration";
import Containers from "./components/Containers";
import ServicePorts from "./components/ServicePorts";
import LabelsAndAnnotations from "./components/LabelsAndAnnotations";
import NodeSelector from "./components/NodeSelector";
import Tolerations from "./components/Tolerations";
import Affinity from "./components/Affinity";
import Volumes from "./components/Volumes";

interface EnvironmentVariable {
  name: string;
  value: string;
  value_from?: Record<string, any>;
}

interface Port {
  port: number;
  target_port: number;
  protocol: "TCP" | "UDP";
}

interface DeploymentFormData {
  type: string;
  namespace: string;
  deployment_name: string;
  tag: string;
  code_source_control_name: string;
  deployment_strategy_id: number;
  replicas: number;
  containers: K8sContainer[];
  service_ports: Port[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  nodeSelector?: Record<string, string>;
  tolerations?: K8sToleration[];
  affinity?: K8sAffinity;
  volumes?: K8sVolume[];
}

interface ITemplates {
    [key:string]:{
        name:string;
        description:string;
        icon:React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
        data:DeploymentFormData
    }
}

const templates: ITemplates = {
  "web-app": {
    name: "Web Application",
    description: "Frontend web app with comprehensive configuration",
    icon: Globe,
    data: {
      type: "web-application",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 3,
      containers: [
        {
          name: "web-app",
          command: [],
          args: ["--port=3000", "--env=production"],
          workingDir: "/app",
          env: [
            { name: "NODE_ENV", value: "production" },
            { name: "PORT", value: "3000" },
            { name: "API_URL", value: "https://api.example.com" },
            { 
              name: "DATABASE_URL", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "app-secrets", 
                  key: "database-url" 
                } 
              } 
            },
            { 
              name: "REDIS_HOST", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "app-config", 
                  key: "redis-host" 
                } 
              } 
            },
          ],
          envFrom: [
            { configMapRef: { name: "app-config" } },
            { secretRef: { name: "app-secrets", optional: true } },
          ],
          ports: [
            { containerPort: 3000, name: "http", protocol: "TCP" as const },
            { containerPort: 9090, name: "metrics", protocol: "TCP" as const },
          ],
          resources: {
            requests: { cpu: "100m", memory: "128Mi" },
            limits: { cpu: "500m", memory: "512Mi" },
          },
          imagePullPolicy: "IfNotPresent",
          volumeMounts: [
            { name: "config-volume", mountPath: "/app/config", readOnly: true },
            { name: "cache-volume", mountPath: "/app/cache" },
            { name: "logs-volume", mountPath: "/app/logs" },
          ],
          livenessProbe: {
            httpGet: {
              path: "/healthz",
              port: 3000,
            },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            successThreshold: 1,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/readyz",
              port: 3000,
            },
            initialDelaySeconds: 5,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          lifecycle: {
            preStop: {
              exec: {
                command: ["/bin/sh", "-c", "sleep 15"],
              },
            },
          },
          terminationMessagePath: "/dev/termination-log",
          terminationMessagePolicy: "File",
          securityContext: {
            allowPrivilegeEscalation: false,
            runAsNonRoot: true,
            runAsUser: 1000,
            readOnlyRootFilesystem: true,
          },
          stdin: false,
          stdinOnce: false,
          tty: false,
        },
      ],
      service_ports: [
        { port: 80, target_port: 3000, protocol: "TCP" as const },
        { port: 9090, target_port: 9090, protocol: "TCP" as const },
      ],
      labels: { 
        app: "web-app", 
        tier: "frontend", 
        version: "v1.0.0",
        environment: "production" 
      },
      annotations: {
        "deployment.kubernetes.io/revision": "1",
        "prometheus.io/scrape": "true",
        "prometheus.io/port": "9090",
        "prometheus.io/path": "/metrics",
      },
      volumes: [
        {
          name: "config-volume",
          configMap: {
            name: "app-config",
            defaultMode: 420,
          },
        },
        {
          name: "cache-volume",
          emptyDir: {
            medium: "Memory",
            sizeLimit: "1Gi",
          },
        },
        {
          name: "logs-volume",
          emptyDir: {},
        },
      ],
      nodeSelector: {
        "kubernetes.io/arch": "amd64",
        "node-type": "frontend",
      },
      tolerations: [
        {
          key: "frontend-only",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
        },
      ],
      affinity: {
        nodeAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "kubernetes.io/arch",
                    operator: "In",
                    values: ["amd64"],
                  },
                ],
              },
            ],
          },
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              preference: {
                matchExpressions: [
                  {
                    key: "node-type",
                    operator: "In",
                    values: ["frontend", "web"],
                  },
                ],
              },
            },
          ],
        },
        podAntiAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              podAffinityTerm: {
                labelSelector: {
                  matchLabels: {
                    app: "web-app",
                  },
                },
                topologyKey: "kubernetes.io/hostname",
              },
            },
          ],
        },
      },
    },
  },
  "api-server": {
    name: "API Server",
    description: "Backend API service with database and cache connectivity",
    icon: Server,
    data: {
      type: "api-server",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 3,
      containers: [
        {
          name: "api-server",
          command: [],
          args: ["--config=/etc/config/app.yaml"],
          workingDir: "/app",
          env: [
            { name: "NODE_ENV", value: "production" },
            { name: "PORT", value: "8080" },
            { name: "METRICS_PORT", value: "9090" },
            { 
              name: "DATABASE_URL", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "api-secrets", 
                  key: "database-url" 
                } 
              } 
            },
            { 
              name: "JWT_SECRET", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "api-secrets", 
                  key: "jwt-secret" 
                } 
              } 
            },
            { 
              name: "REDIS_HOST", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "api-config", 
                  key: "redis-host" 
                } 
              } 
            },
            { 
              name: "LOG_LEVEL", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "api-config", 
                  key: "log-level" 
                } 
              } 
            },
          ],
          envFrom: [
            { configMapRef: { name: "api-config" } },
            { secretRef: { name: "api-secrets" } },
          ],
          ports: [
            { containerPort: 8080, name: "http", protocol: "TCP" as const },
            { containerPort: 9090, name: "metrics", protocol: "TCP" as const },
          ],
          resources: {
            requests: { cpu: "200m", memory: "256Mi" },
            limits: { cpu: "1000m", memory: "1Gi" },
          },
          imagePullPolicy: "IfNotPresent",
          volumeMounts: [
            { name: "config-volume", mountPath: "/etc/config", readOnly: true },
            { name: "data-volume", mountPath: "/app/data" },
            { name: "logs-volume", mountPath: "/app/logs" },
            { name: "tmp-volume", mountPath: "/tmp" },
          ],
          livenessProbe: {
            httpGet: {
              path: "/healthz",
              port: 8080,
            },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            successThreshold: 1,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/readyz",
              port: 8080,
            },
            initialDelaySeconds: 10,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          startupProbe: {
            httpGet: {
              path: "/startup",
              port: 8080,
            },
            initialDelaySeconds: 10,
            periodSeconds: 10,
            timeoutSeconds: 5,
            successThreshold: 1,
            failureThreshold: 30,
          },
          lifecycle: {
            preStop: {
              exec: {
                command: ["/bin/sh", "-c", "sleep 15"],
              },
            },
          },
          terminationMessagePath: "/dev/termination-log",
          terminationMessagePolicy: "File",
          securityContext: {
            allowPrivilegeEscalation: false,
            runAsNonRoot: true,
            runAsUser: 1000,
            readOnlyRootFilesystem: true,
          },
          stdin: false,
          stdinOnce: false,
          tty: false,
        },
      ],
      service_ports: [
        { port: 8080, target_port: 8080, protocol: "TCP" as const },
        { port: 9090, target_port: 9090, protocol: "TCP" as const },
      ],
      labels: { 
        app: "api-server", 
        tier: "backend", 
        version: "v1.0.0",
        component: "api",
        environment: "production" 
      },
      annotations: {
        "deployment.kubernetes.io/revision": "1",
        "prometheus.io/scrape": "true",
        "prometheus.io/port": "9090",
        "prometheus.io/path": "/metrics",
        "fluentd.org/include": "true",
      },
      volumes: [
        {
          name: "config-volume",
          configMap: {
            name: "api-config",
            defaultMode: 420,
          },
        },
        {
          name: "data-volume",
          persistentVolumeClaim: {
            claimName: "api-data-pvc",
          },
        },
        {
          name: "logs-volume",
          emptyDir: {},
        },
        {
          name: "tmp-volume",
          emptyDir: {
            medium: "Memory",
            sizeLimit: "100Mi",
          },
        },
      ],
      nodeSelector: {
        "kubernetes.io/arch": "amd64",
        "node-type": "backend",
      },
      tolerations: [
        {
          key: "backend-only",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
        },
        {
          key: "high-memory",
          operator: "Exists",
          effect: "NoSchedule",
        },
      ],
      affinity: {
        nodeAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "kubernetes.io/arch",
                    operator: "In",
                    values: ["amd64"],
                  },
                ],
              },
            ],
          },
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              preference: {
                matchExpressions: [
                  {
                    key: "node-type",
                    operator: "In",
                    values: ["backend", "api"],
                  },
                ],
              },
            },
          ],
        },
        podAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 50,
              podAffinityTerm: {
                labelSelector: {
                  matchLabels: {
                    app: "redis",
                  },
                },
                topologyKey: "kubernetes.io/hostname",
              },
            },
          ],
        },
        podAntiAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: [
            {
              labelSelector: {
                matchLabels: {
                  app: "api-server",
                },
              },
              topologyKey: "kubernetes.io/hostname",
            },
          ],
        },
      },
    },
  },
  "microservice": {
    name: "Microservice",
    description: "Lightweight microservice with essential configurations",
    icon: Cpu,
    data: {
      type: "microservice",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 2,
      containers: [
        {
          name: "microservice",
          command: [],
          args: ["--port=9000"],
          workingDir: "/app",
          env: [
            { name: "SERVICE_NAME", value: "user-service" },
            { name: "LOG_LEVEL", value: "info" },
            { name: "PORT", value: "9000" },
            { 
              name: "DB_PASSWORD", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "microservice-secrets", 
                  key: "db-password" 
                } 
              } 
            },
            { 
              name: "SERVICE_VERSION", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "microservice-config", 
                  key: "version" 
                } 
              } 
            },
          ],
          envFrom: [
            { configMapRef: { name: "microservice-config" } },
          ],
          ports: [
            { containerPort: 9000, name: "http", protocol: "TCP" as const },
            { containerPort: 9090, name: "metrics", protocol: "TCP" as const },
          ],
          resources: {
            requests: { cpu: "50m", memory: "64Mi" },
            limits: { cpu: "200m", memory: "256Mi" },
          },
          imagePullPolicy: "IfNotPresent",
          volumeMounts: [
            { name: "config-volume", mountPath: "/app/config", readOnly: true },
            { name: "cache-volume", mountPath: "/app/cache" },
          ],
          livenessProbe: {
            httpGet: {
              path: "/healthz",
              port: 9000,
            },
            initialDelaySeconds: 15,
            periodSeconds: 10,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/readyz",
              port: 9000,
            },
            initialDelaySeconds: 5,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          lifecycle: {
            preStop: {
              exec: {
                command: ["/bin/sh", "-c", "sleep 10"],
              },
            },
          },
          terminationMessagePath: "/dev/termination-log",
          terminationMessagePolicy: "File",
          securityContext: {
            allowPrivilegeEscalation: false,
            runAsNonRoot: true,
            runAsUser: 1000,
            readOnlyRootFilesystem: true,
          },
          stdin: false,
          stdinOnce: false,
          tty: false,
        },
      ],
      service_ports: [
        { port: 9000, target_port: 9000, protocol: "TCP" as const },
        { port: 9090, target_port: 9090, protocol: "TCP" as const },
      ],
      labels: { 
        app: "microservice", 
        type: "service", 
        version: "v1.0.0",
        component: "microservice" 
      },
      annotations: {
        "prometheus.io/scrape": "true",
        "prometheus.io/port": "9090",
        "prometheus.io/path": "/metrics",
      },
      volumes: [
        {
          name: "config-volume",
          configMap: {
            name: "microservice-config",
            defaultMode: 420,
          },
        },
        {
          name: "cache-volume",
          emptyDir: {
            sizeLimit: "100Mi",
          },
        },
      ],
      nodeSelector: {
        "kubernetes.io/arch": "amd64",
      },
      tolerations: [
        {
          key: "spot-instance",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
        },
      ],
      affinity: {
        podAntiAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              podAffinityTerm: {
                labelSelector: {
                  matchLabels: {
                    app: "microservice",
                  },
                },
                topologyKey: "kubernetes.io/hostname",
              },
            },
          ],
        },
      },
    },
  },
  "database": {
    name: "Database",
    description: "Stateful database service with persistent storage",
    icon: HardDrive,
    data: {
      type: "database",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 1,
      containers: [
        {
          name: "database",
          command: [],
          args: ["--config=/etc/postgresql/postgresql.conf"],
          workingDir: "/var/lib/postgresql/data",
          env: [
            { 
              name: "POSTGRES_PASSWORD", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "database-secrets", 
                  key: "postgres-password" 
                } 
              } 
            },
            { 
              name: "POSTGRES_USER", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "database-secrets", 
                  key: "postgres-user" 
                } 
              } 
            },
            { 
              name: "POSTGRES_DB", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "database-config", 
                  key: "postgres-db" 
                } 
              } 
            },
            { name: "PGDATA", value: "/var/lib/postgresql/data/pgdata" },
          ],
          envFrom: [
            { configMapRef: { name: "database-config" } },
          ],
          ports: [
            { containerPort: 5432, name: "postgres", protocol: "TCP" as const },
          ],
          resources: {
            requests: { cpu: "500m", memory: "1Gi" },
            limits: { cpu: "2000m", memory: "4Gi" },
          },
          imagePullPolicy: "IfNotPresent",
          volumeMounts: [
            { name: "data-volume", mountPath: "/var/lib/postgresql/data" },
            { name: "config-volume", mountPath: "/etc/postgresql", readOnly: true },
            { name: "backup-volume", mountPath: "/backup" },
          ],
          livenessProbe: {
            exec: {
              command: ["pg_isready", "-U", "postgres"],
            },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            successThreshold: 1,
            failureThreshold: 3,
          },
          readinessProbe: {
            exec: {
              command: ["pg_isready", "-U", "postgres"],
            },
            initialDelaySeconds: 10,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          lifecycle: {
            preStop: {
              exec: {
                command: ["/bin/sh", "-c", "pg_ctl stop -D /var/lib/postgresql/data/pgdata -m fast"],
              },
            },
          },
          terminationMessagePath: "/dev/termination-log",
          terminationMessagePolicy: "File",
          securityContext: {
            allowPrivilegeEscalation: false,
            runAsNonRoot: true,
            runAsUser: 999,
          },
          stdin: false,
          stdinOnce: false,
          tty: false,
        },
      ],
      service_ports: [
        { port: 5432, target_port: 5432, protocol: "TCP" as const },
      ],
      labels: { 
        app: "database", 
        tier: "database", 
        version: "v1.0.0",
        component: "postgres" 
      },
      annotations: {
        "backup.kubernetes.io/schedule": "0 2 * * *",
        "monitoring.coreos.com/enabled": "true",
      },
      volumes: [
        {
          name: "data-volume",
          persistentVolumeClaim: {
            claimName: "database-data-pvc",
          },
        },
        {
          name: "config-volume",
          configMap: {
            name: "database-config",
            defaultMode: 420,
          },
        },
        {
          name: "backup-volume",
          persistentVolumeClaim: {
            claimName: "database-backup-pvc",
          },
        },
      ],
      nodeSelector: {
        "kubernetes.io/arch": "amd64",
        "node-type": "database",
      },
      tolerations: [
        {
          key: "database-only",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
        },
        {
          key: "high-storage",
          operator: "Exists",
          effect: "NoSchedule",
        },
      ],
      affinity: {
        nodeAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: [
              {
                matchExpressions: [
                  {
                    key: "node-type",
                    operator: "In",
                    values: ["database", "storage"],
                  },
                ],
              },
            ],
          },
        },
        podAntiAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: [
            {
              labelSelector: {
                matchLabels: {
                  app: "database",
                },
              },
              topologyKey: "kubernetes.io/hostname",
            },
          ],
        },
      },
    },
  },
  "worker": {
    name: "Background Worker",
    description: "Background job processing service",
    icon: Users,
    data: {
      type: "worker",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 2,
      containers: [
        {
          name: "worker",
          command: [],
          args: ["--worker-type=background", "--concurrency=4"],
          workingDir: "/app",
          env: [
            { name: "WORKER_TYPE", value: "background" },
            { name: "CONCURRENCY", value: "4" },
            { name: "LOG_LEVEL", value: "info" },
            { 
              name: "REDIS_URL", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "worker-secrets", 
                  key: "redis-url" 
                } 
              } 
            },
            { 
              name: "DATABASE_URL", 
              valueFrom: { 
                secretKeyRef: { 
                  name: "worker-secrets", 
                  key: "database-url" 
                } 
              } 
            },
            { 
              name: "QUEUE_NAME", 
              valueFrom: { 
                configMapKeyRef: { 
                  name: "worker-config", 
                  key: "queue-name" 
                } 
              } 
            },
          ],
          envFrom: [
            { configMapRef: { name: "worker-config" } },
            { secretRef: { name: "worker-secrets" } },
          ],
          ports: [
            { containerPort: 9090, name: "metrics", protocol: "TCP" as const },
          ],
          resources: {
            requests: { cpu: "100m", memory: "128Mi" },
            limits: { cpu: "500m", memory: "512Mi" },
          },
          imagePullPolicy: "IfNotPresent",
          volumeMounts: [
            { name: "config-volume", mountPath: "/app/config", readOnly: true },
            { name: "logs-volume", mountPath: "/app/logs" },
            { name: "tmp-volume", mountPath: "/tmp" },
          ],
          livenessProbe: {
            httpGet: {
              path: "/healthz",
              port: 9090,
            },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            successThreshold: 1,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/readyz",
              port: 9090,
            },
            initialDelaySeconds: 10,
            periodSeconds: 5,
            timeoutSeconds: 2,
            successThreshold: 1,
            failureThreshold: 3,
          },
          lifecycle: {
            preStop: {
              exec: {
                command: ["/bin/sh", "-c", "sleep 30"],
              },
            },
          },
          terminationMessagePath: "/dev/termination-log",
          terminationMessagePolicy: "File",
          securityContext: {
            allowPrivilegeEscalation: false,
            runAsNonRoot: true,
            runAsUser: 1000,
            readOnlyRootFilesystem: true,
          },
          stdin: false,
          stdinOnce: false,
          tty: false,
        },
      ],
      service_ports: [
        { port: 9090, target_port: 9090, protocol: "TCP" as const },
      ],
      labels: { 
        app: "worker", 
        tier: "worker", 
        version: "v1.0.0",
        component: "background-worker" 
      },
      annotations: {
        "prometheus.io/scrape": "true",
        "prometheus.io/port": "9090",
        "prometheus.io/path": "/metrics",
      },
      volumes: [
        {
          name: "config-volume",
          configMap: {
            name: "worker-config",
            defaultMode: 420,
          },
        },
        {
          name: "logs-volume",
          emptyDir: {},
        },
        {
          name: "tmp-volume",
          emptyDir: {
            medium: "Memory",
            sizeLimit: "100Mi",
          },
        },
      ],
      nodeSelector: {
        "kubernetes.io/arch": "amd64",
        "node-type": "worker",
      },
      tolerations: [
        {
          key: "worker-only",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
        },
        {
          key: "spot-instance",
          operator: "Equal",
          value: "true",
          effect: "NoSchedule",
          tolerationSeconds: 300,
        },
      ],
      affinity: {
        nodeAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              preference: {
                matchExpressions: [
                  {
                    key: "node-type",
                    operator: "In",
                    values: ["worker", "compute"],
                  },
                ],
              },
            },
          ],
        },
        podAntiAffinity: {
          preferredDuringSchedulingIgnoredDuringExecution: [
            {
              weight: 100,
              podAffinityTerm: {
                labelSelector: {
                  matchLabels: {
                    app: "worker",
                  },
                },
                topologyKey: "kubernetes.io/hostname",
              },
            },
          ],
        },
      },
    },
  },
};

const CreateRelease = () => {
  const form = useForm<DeploymentFormData>({
    defaultValues: {
      type: "",
      namespace: "",
      deployment_name: "",
      tag: "",
      code_source_control_name: "",
      deployment_strategy_id: 0,
      replicas: 1,
      containers: [
        {
          name: "",
          command: [],
          args: [],
          env: [],
          ports: [],
          resources: {
            requests: {},
            limits: {},
          },
        },
      ],
      service_ports: [],
      labels: {},
      annotations: {},
      nodeSelector: {},
      tolerations: [],
      affinity: undefined,
      volumes: [],
    },
  });

  const [selectedTemplate, setSelectedTemplate] = useState("");

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    console.log({ template });
    if (template) {
      const currentValues = form.getValues();
      form.reset({
        ...currentValues,
        ...template.data,
        namespace: currentValues.namespace,
        deployment_name: currentValues.deployment_name,
        tag: currentValues.tag,
        code_source_control_name: currentValues.code_source_control_name,
        deployment_strategy_id: currentValues.deployment_strategy_id,
      });
    }
  };

  const handleSubmit = (data: DeploymentFormData) => {
    console.log("Deployment Form Data:", data);
    // Handle form submission
  };

  return (
    <>
      <Card className="p-4 shadow-none border mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-slate-900 flex items-center gap-2">
            <Layout className="h-5 w-5 text-slate-600" />
            Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(templates).map(([key, template]) => {
              const IconComponent = template.icon;
              return (
                <div
                  key={key}
                  className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === key
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => {
                    setSelectedTemplate(key);
                    applyTemplate(key);
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-900 flex items-center gap-2">
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-base text-slate-600">
                    {template.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form
          id="release-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <BasicConfiguration form={form} />
          <Containers form={form} />
          <ServicePorts form={form} />
          <LabelsAndAnnotations form={form} />
          <NodeSelector form={form} />
          <Tolerations form={form} />
          <Affinity form={form} />
          
          <Volumes form={form} />
        </form>
      </Form>
    </>
  );
};

export default CreateRelease;

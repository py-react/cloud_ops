import { DeploymentFormData } from '../yaml/yamlUtils';

export interface DeploymentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  data: Partial<DeploymentFormData>;
}

export const deploymentTemplates: DeploymentTemplate[] = [
  {
    id: 'webApp',
    name: 'Web Application',
    description: 'Frontend web server with HTTP port and health checks',
    icon: 'Globe',
    data: {
      replicas: 2,
      containers: [
        {
          name: '',
          image: '',
          imagePullPolicy: 'IfNotPresent',
          command: [],
          args: [],
          workingDir: undefined,
          env: [],
          ports: [{ containerPort: 80, name: 'http', protocol: 'TCP' }],
          resources: {
            requests: { cpu: '100m', memory: '128Mi' },
            limits: { cpu: '500m', memory: '512Mi' },
          },
          volumeMounts: [],
          livenessProbe: {
            httpGet: { path: '/healthz', port: 'http' },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: { path: '/ready', port: 'http' },
            initialDelaySeconds: 5,
            periodSeconds: 5,
            timeoutSeconds: 3,
            failureThreshold: 3,
          },
        },
      ],
      service_ports: [{ port: 80, target_port: 80, protocol: 'TCP' }],
      labels: { app: '' },
      annotations: {},
      node_selector: {},
      tolerations: [],
      affinity: undefined,
      volumes: [],
    },
  },
  {
    id: 'apiServer',
    name: 'API Server',
    description: 'Backend API service with JSON endpoints',
    icon: 'Server',
    data: {
      replicas: 2,
      containers: [
        {
          name: '',
          image: '',
          imagePullPolicy: 'IfNotPresent',
          command: [],
          args: [],
          workingDir: undefined,
          env: [],
          ports: [{ containerPort: 8080, name: 'http', protocol: 'TCP' }],
          resources: {
            requests: { cpu: '100m', memory: '256Mi' },
            limits: { cpu: '1000m', memory: '1Gi' },
          },
          volumeMounts: [],
          livenessProbe: {
            httpGet: { path: '/health', port: 'http' },
            initialDelaySeconds: 15,
            periodSeconds: 10,
            timeoutSeconds: 5,
            failureThreshold: 3,
          },
          readinessProbe: {
            httpGet: { path: '/ready', port: 'http' },
            initialDelaySeconds: 5,
            periodSeconds: 5,
            timeoutSeconds: 3,
            failureThreshold: 3,
          },
        },
      ],
      service_ports: [{ port: 8080, target_port: 8080, protocol: 'TCP' }],
      labels: { app: '' },
      annotations: {},
      node_selector: {},
      tolerations: [],
      affinity: undefined,
      volumes: [],
    },
  },
  {
    id: 'worker',
    name: 'Worker / Job',
    description: 'Background worker process without network exposure',
    icon: 'Cpu',
    data: {
      replicas: 1,
      containers: [
        {
          name: '',
          image: '',
          imagePullPolicy: 'IfNotPresent',
          command: [],
          args: [],
          workingDir: undefined,
          env: [],
          ports: [],
          resources: {
            requests: { cpu: '100m', memory: '128Mi' },
            limits: { cpu: '500m', memory: '512Mi' },
          },
          volumeMounts: [],
          livenessProbe: undefined,
          readinessProbe: undefined,
        },
      ],
      service_ports: [],
      labels: { app: '' },
      annotations: {},
      node_selector: {},
      tolerations: [],
      affinity: undefined,
      volumes: [],
    },
  },
  {
    id: 'database',
    name: 'Database / Stateful',
    description: 'Stateful workload with persistent storage',
    icon: 'HardDrive',
    data: {
      replicas: 1,
      containers: [
        {
          name: '',
          image: '',
          imagePullPolicy: 'IfNotPresent',
          command: [],
          args: [],
          workingDir: undefined,
          env: [],
          ports: [{ containerPort: 5432, name: 'postgresql', protocol: 'TCP' }],
          resources: {
            requests: { cpu: '250m', memory: '512Mi' },
            limits: { cpu: '2000m', memory: '4Gi' },
          },
          volumeMounts: [{ name: 'data', mountPath: '/var/lib/postgresql/data', readOnly: false }],
          livenessProbe: {
            exec: { command: ['pg_isready', '-U', 'postgres'] },
            initialDelaySeconds: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            failureThreshold: 3,
          },
        },
      ],
      service_ports: [{ port: 5432, target_port: 5432, protocol: 'TCP' }],
      labels: { app: '' },
      annotations: {},
      node_selector: {},
      tolerations: [],
      affinity: undefined,
      volumes: [
        { name: 'data', emptyDir: { medium: '', sizeLimit: '10Gi' } },
      ],
    },
  },
];

export function getTemplateById(id: string): DeploymentTemplate | undefined {
  return deploymentTemplates.find((template) => template.id === id);
}

export function getTemplateNames(): { id: string; name: string }[] {
  return deploymentTemplates.map((template) => ({
    id: template.id,
    name: template.name,
  }));
}

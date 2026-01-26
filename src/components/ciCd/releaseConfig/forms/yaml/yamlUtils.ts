import yaml from 'js-yaml';

import { DeploymentFormData } from '../components/formUtils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

export function yamlToForm(yamlStr: string): Partial<DeploymentFormData> {
  try {
    const parsed = yaml.load(yamlStr) as any;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const formData: Partial<DeploymentFormData> = {
      type: parsed.type || 'web-app',
      tag: parsed.tag || 'latest',
      code_source_control_name: parsed.code_source_control_name || '',
      deployment_strategy_id: parsed.deployment_strategy_id || 1,
    };

    if (parsed.metadata) {
      if (parsed.metadata.name) formData.deployment_name = parsed.metadata.name;
      if (parsed.metadata.namespace) formData.namespace = parsed.metadata.namespace;
      if (parsed.metadata.annotations) formData.annotations = parsed.metadata.annotations;

      // If root labels exist, use them, but prefer spec.template labels if available later
      if (parsed.metadata.labels) formData.labels = parsed.metadata.labels;
    }

    if (parsed.spec) {
      if (typeof parsed.spec.replicas === 'number') formData.replicas = parsed.spec.replicas;

      // Extract labels from template if available (this is the primary source in formToYaml)
      if (parsed.spec.template?.metadata?.labels) {
        formData.labels = parsed.spec.template.metadata.labels;
      }

      if (parsed.spec.template?.spec?.nodeSelector) {
        formData.node_selector = parsed.spec.template.spec.nodeSelector;
      }

      if (parsed.spec.template?.spec?.containers) {
        formData.containers = parsed.spec.template.spec.containers.map((container: any) => ({
          name: container.name,
          imagePullPolicy: container.imagePullPolicy,
          command: container.command || [],
          args: container.args || [],
          workingDir: container.workingDir,
          env: container.env?.map((env: any) => {
            if (env.value) return { name: env.name, value: env.value };
            if (env.valueFrom) return { name: env.name, valueFrom: env.valueFrom };
            return { name: env.name, value: '' };
          }) || [],
          ports: container.ports?.map((port: any) => ({
            containerPort: port.containerPort,
            name: port.name,
            protocol: port.protocol || 'TCP',
          })) || [],
          resources: {
            requests: container.resources?.requests || {},
            limits: container.resources?.limits || {},
          },
          volumeMounts: container.volumeMounts?.map((vm: any) => ({
            name: vm.name,
            mountPath: vm.mountPath,
            readOnly: vm.readOnly || false,
          })) || [],
          livenessProbe: container.livenessProbe,
          readinessProbe: container.readinessProbe,
          startupProbe: container.startupProbe,
          securityContext: container.securityContext,
        }));
      }

      if (parsed.spec.template?.spec?.volumes) {
        formData.volumes = parsed.spec.template.spec.volumes.map((vol: any) => {
          if (vol.emptyDir) return { name: vol.name, emptyDir: vol.emptyDir };
          if (vol.configMap) return { name: vol.name, configMap: vol.configMap };
          if (vol.secret) return { name: vol.name, secret: vol.secret };
          if (vol.persistentVolumeClaim) return { name: vol.name, persistentVolumeClaim: vol.persistentVolumeClaim };
          return { name: vol.name };
        });
      }

      if (parsed.spec.template?.spec?.tolerations) {
        formData.tolerations = parsed.spec.template.spec.tolerations;
      }

      if (parsed.spec.template?.spec?.affinity) {
        formData.affinity = parsed.spec.template.spec.affinity;
      }

      if (parsed.spec.template?.spec?.containers) {
        formData.service_ports = parsed.spec.template.spec.containers
          .flatMap((c: any) => c.ports || [])
          .map((port: any) => ({
            port: port.containerPort,
            target_port: port.containerPort,
            protocol: port.protocol || 'TCP',
          }));
      }
    }

    return formData;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return {};
  }
}

export function removeEmpty(obj: any, keysToKeep: string[] = []): any {
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map(v => removeEmpty(v, keysToKeep))
      .filter(v => v !== undefined && v !== null);
    return cleaned.length > 0 ? cleaned : undefined;
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned = Object.entries(obj)
      .map(([k, v]) => [k, removeEmpty(v, keysToKeep)])
      .filter(([k, v]) => {
        if (keysToKeep.includes(k)) return true;
        return v !== undefined && v !== null && (typeof v !== 'object' || Object.keys(v).length > 0);
      })
      .reduce((a, [k, v]) => {
        let val = v;
        if (val === undefined && keysToKeep.includes(k)) {
          // Identify if it's likely an object-mapped structural key
          const structuralObjectKeys = ['metadata', 'selector', 'matchLabels', 'template', 'containers', 'spec'];
          if (structuralObjectKeys.includes(k)) {
            val = k === 'containers' ? [] : {};
          }
        }
        return { ...a, [k as string]: val };
      }, {});
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return (obj === null || obj === undefined) ? undefined : obj;
}

export function formToYaml(form: Partial<DeploymentFormData>): string {
  const deployment: any = {
    type: form.type,
    tag: form.tag,
    code_source_control_name: form.code_source_control_name,
    deployment_strategy_id: form.deployment_strategy_id,
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: (form.deployment_name || '').toLowerCase().trim(),
      namespace: form.namespace || 'default',
    },
    spec: {
      replicas: form.replicas,
      selector: {
        matchLabels: {
          app: (form.deployment_name || '').toLowerCase().trim(),
        },
      },
      template: {
        metadata: {
          labels: form.labels,
          annotations: form.annotations,
        },
        spec: {
          containers: (form.containers || []).map((container) => ({
            name: (container.name || '').toLowerCase().trim(),
            imagePullPolicy: container.imagePullPolicy,
            command: container.command,
            args: container.args,
            workingDir: container.workingDir,
            env: container.env?.map((env: any) => {
              if (env.valueFrom) return { name: env.name, valueFrom: env.valueFrom };
              return { name: env.name, value: env.value };
            }),
            ports: container.ports?.map((port: any) => ({
              containerPort: port.containerPort,
              name: port.name,
              protocol: port.protocol,
            })),
            resources: container.resources,
            volumeMounts: container.volumeMounts,
            livenessProbe: container.livenessProbe,
            readinessProbe: container.readinessProbe,
            startupProbe: container.startupProbe,
            securityContext: container.securityContext,
          })),
          volumes: (form.volumes || []).map((vol: any) => {
            if (vol.emptyDir) return { name: vol.name, emptyDir: vol.emptyDir };
            if (vol.configMap) return { name: vol.name, configMap: vol.configMap };
            if (vol.secret) return { name: vol.name, secret: vol.secret };
            if (vol.persistentVolumeClaim) return { name: vol.name, persistentVolumeClaim: vol.persistentVolumeClaim };
            return { name: vol.name };
          }),
          nodeSelector: form.node_selector,
          tolerations: form.tolerations,
          affinity: form.affinity,
          restartPolicy: 'Always',
        },
      },
    },
  };

  // Preserve mandatory K8s structural keys
  const cleaned = removeEmpty(deployment, ['name', 'selector', 'matchLabels', 'template', 'metadata', 'containers']);

  // Minimal requirements if we want to show SOMETHING
  if (!cleaned) return "";

  return yaml.dump(cleaned, { indent: 2, lineWidth: -1, noRefs: true });
}

export function mergeFormAndYaml(form: DeploymentFormData, yamlData: Partial<DeploymentFormData>): DeploymentFormData {
  const merged = { ...form };

  if (yamlData.namespace) merged.namespace = yamlData.namespace;
  if (yamlData.deployment_name) merged.deployment_name = yamlData.deployment_name;
  if (typeof yamlData.replicas === 'number') merged.replicas = yamlData.replicas;
  if (yamlData.labels) merged.labels = yamlData.labels;
  if (yamlData.annotations) merged.annotations = yamlData.annotations;
  if (yamlData.node_selector) merged.node_selector = yamlData.node_selector;
  if (yamlData.containers) merged.containers = yamlData.containers;
  if (yamlData.service_ports) merged.service_ports = yamlData.service_ports;
  if (yamlData.volumes) merged.volumes = yamlData.volumes;
  if (yamlData.tolerations) merged.tolerations = yamlData.tolerations;
  if (yamlData.affinity) merged.affinity = yamlData.affinity;

  return merged;
}

export function parseYaml(yamlStr: string): { valid: boolean; data?: any; error?: string } {
  try {
    const data = yaml.load(yamlStr);
    return { valid: true, data };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export function stringifyYaml(data: any): string {
  return yaml.dump(data, { indent: 2, lineWidth: -1, noRefs: true });
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface K8sValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateKubernetesSpec(data: any): K8sValidationResult {
  const errors: ValidationError[] = [];

  if (!data) {
    errors.push({ path: '', message: 'Empty YAML document' });
    return { valid: false, errors };
  }

  if (data.kind !== 'Deployment') {
    errors.push({ path: 'kind', message: 'Must be a Deployment resource' });
  }

  if (!data.apiVersion) {
    errors.push({ path: 'apiVersion', message: 'is required' });
  } else if (!data.apiVersion.includes('apps/v1') && !data.apiVersion.includes('v1')) {
    errors.push({ path: 'apiVersion', message: 'Unsupported apiVersion. Use apps/v1' });
  }

  if (!data.metadata) {
    errors.push({ path: 'metadata', message: 'is required' });
  } else {
    if (typeof data.metadata.name !== 'string') {
      errors.push({ path: 'metadata.name', message: 'is required' });
    }
    if (data.metadata.name && !isValidDNSLabel(data.metadata.name)) {
      errors.push({ path: 'metadata.name', message: 'must be a valid DNS label (lowercase alphanumeric, hyphens)' });
    }
  }

  if (!data.spec) {
    errors.push({ path: 'spec', message: 'is required' });
    return { valid: false, errors };
  }

  if (typeof data.spec.replicas !== 'undefined') {
    if (typeof data.spec.replicas !== 'number' || data.spec.replicas < 0) {
      errors.push({ path: 'spec.replicas', message: 'must be a non-negative number' });
    }
  }

  if (!data.spec.selector) {
    errors.push({ path: 'spec.selector', message: 'is required' });
  }

  if (!data.spec.template) {
    errors.push({ path: 'spec.template', message: 'is required' });
  } else {
    if (!data.spec.template.metadata) {
      errors.push({ path: 'spec.template.metadata', message: 'is required' });
    }

    if (!data.spec.template.spec) {
      errors.push({ path: 'spec.template.spec', message: 'is required' });
    } else {
      if (!data.spec.template.spec.containers || !Array.isArray(data.spec.template.spec.containers)) {
        errors.push({ path: 'spec.template.spec.containers', message: 'is required and must be an array' });
      } else {
        data.spec.template.spec.containers.forEach((container: any, index: number) => {
          if (typeof container.name !== 'string') {
            errors.push({ path: `spec.template.spec.containers[${index}].name`, message: 'is required' });
          }
          if (container.name && !isValidDNSLabel(container.name)) {
            errors.push({ path: `spec.template.spec.containers[${index}].name`, message: 'must be a valid DNS label' });
          }
          if (container.imagePullPolicy && !['Always', 'IfNotPresent', 'Never'].includes(container.imagePullPolicy)) {
            errors.push({ path: `spec.template.spec.containers[${index}].imagePullPolicy`, message: 'must be Always, IfNotPresent, or Never' });
          }

          if (container.ports) {
            if (!Array.isArray(container.ports)) {
              errors.push({ path: `spec.template.spec.containers[${index}].ports`, message: 'must be an array' });
            } else {
              container.ports.forEach((port: any, portIndex: number) => {
                if (typeof port.containerPort !== 'number' || port.containerPort < 0 || port.containerPort > 65535) {
                  errors.push({ path: `spec.template.spec.containers[${index}].ports[${portIndex}].containerPort`, message: 'must be between 0 and 65535' });
                }
                if (port.protocol && !['TCP', 'UDP', 'SCTP'].includes(port.protocol)) {
                  errors.push({ path: `spec.template.spec.containers[${index}].ports[${portIndex}].protocol`, message: 'must be TCP, UDP, or SCTP' });
                }
              });
            }
          }

          if (container.resources) {
            if (container.resources.requests) {
              Object.entries(container.resources.requests).forEach(([key, value]) => {
                if (typeof value !== 'string') {
                  errors.push({ path: `spec.template.spec.containers[${index}].resources.requests.${key}`, message: 'must be strings (e.g., "100m", "128Mi")' });
                }
              });
            }
            if (container.resources.limits) {
              Object.entries(container.resources.limits).forEach(([key, value]) => {
                if (typeof value !== 'string') {
                  errors.push({ path: `spec.template.spec.containers[${index}].resources.limits.${key}`, message: 'must be strings (e.g., "500m", "512Mi")' });
                }
              });
            }
          }

          if (container.env) {
            container.env.forEach((env: any, envIndex: number) => {
              if (!env.name) {
                errors.push({ path: `spec.template.spec.containers[${index}].env[${envIndex}].name`, message: 'is required' });
              }
            });
          }

          if (container.volumeMounts) {
            container.volumeMounts.forEach((vm: any, vmIndex: number) => {
              if (!vm.name) {
                errors.push({ path: `spec.template.spec.containers[${index}].volumeMounts[${vmIndex}].name`, message: 'is required' });
              }
              if (!vm.mountPath) {
                errors.push({ path: `spec.template.spec.containers[${index}].volumeMounts[${vmIndex}].mountPath`, message: 'is required' });
              }
            });
          }
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidDNSLabel(label: string): boolean {
  if (!label) return true; // Allow empty, handle with required check elsewhere
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label);
}

export function validateResourceQuantity(value: string): boolean {
  const regex = /^(\d+)(m|[KMGT]i?)?$/;
  return regex.test(value);
}

export function getFieldHint(path: string): string {
  const hints: Record<string, string> = {
    'metadata.name': 'Unique name for the deployment',
    'metadata.namespace': 'Namespace for the deployment (default: default)',
    'spec.replicas': 'Number of pod replicas (default: 1)',
    'spec.selector.matchLabels': 'Labels to match pods for this deployment',
    'spec.template.spec.containers[].name': 'Unique name for the container',
    'spec.template.spec.containers[].image': 'Container image URL or name',
    'spec.template.spec.containers[].imagePullPolicy': 'When to pull the image (Always, IfNotPresent, Never)',
    'spec.template.spec.containers[].ports[].containerPort': 'Port the container listens on',
    'spec.template.spec.containers[].resources.requests.cpu': 'CPU request (e.g., 100m, 0.5)',
    'spec.template.spec.containers[].resources.requests.memory': 'Memory request (e.g., 128Mi, 1Gi)',
    'spec.template.spec.containers[].resources.limits.cpu': 'CPU limit (e.g., 500m, 2)',
    'spec.template.spec.containers[].resources.limits.memory': 'Memory limit (e.g., 512Mi, 2Gi)',
    'spec.template.spec.containers[].env[].name': 'Environment variable name',
    'spec.template.spec.containers[].env[].value': 'Environment variable value',
    'spec.template.spec.containers[].volumeMounts[].name': 'Name of the volume to mount',
    'spec.template.spec.containers[].volumeMounts[].mountPath': 'Path where the volume should be mounted',
    'spec.template.spec.volumes[].name': 'Unique name for the volume',
    'spec.template.spec.volumes[].emptyDir': 'Ephemeral storage that disappears when pod is deleted',
    'spec.template.spec.volumes[].configMap': 'Volume from a ConfigMap',
    'spec.template.spec.volumes[].secret': 'Volume from a Secret',
    'spec.template.spec.volumes[].persistentVolumeClaim': 'Volume from a PersistentVolumeClaim',
    'spec.template.spec.tolerations[].key': 'Taint key the toleration matches',
    'spec.template.spec.tolerations[].operator': 'Operator for matching (Exists, Equal)',
    'spec.template.spec.tolerations[].value': 'Taint value (when operator is Equal)',
    'spec.template.spec.tolerations[].effect': 'Taint effect to tolerate (NoSchedule, PreferNoSchedule, NoExecute)',
  };

  return hints[path] || '';
}

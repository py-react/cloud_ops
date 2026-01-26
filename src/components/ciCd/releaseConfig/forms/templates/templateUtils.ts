import { DeploymentFormData } from '../yaml/yamlUtils';
import { DeploymentTemplate, getTemplateById } from './deploymentTemplates';

export interface TemplateApplicationResult {
  success: boolean;
  data: Partial<DeploymentFormData>;
  warnings: string[];
}

export function applyTemplate(templateId: string, baseData?: Partial<DeploymentFormData>): TemplateApplicationResult {
  const template = getTemplateById(templateId);

  if (!template) {
    return {
      success: false,
      data: {},
      warnings: [`Template '${templateId}' not found`],
    };
  }

  const warnings: string[] = [];
  const mergedData = { ...template.data };

  if (baseData) {
    if (baseData.deployment_name) {
      mergedData.deployment_name = baseData.deployment_name;
    }
    if (baseData.namespace) {
      mergedData.namespace = baseData.namespace;
    }
    if (baseData.labels) {
      mergedData.labels = { ...mergedData.labels, ...baseData.labels };
    }
    if (baseData.annotations) {
      mergedData.annotations = { ...mergedData.annotations, ...baseData.annotations };
    }
    if (baseData.node_selector) {
      mergedData.node_selector = { ...mergedData.node_selector, ...baseData.node_selector };
    }
  }

  return {
    success: true,
    data: mergedData,
    warnings,
  };
}

export function applyTemplateWithDefaults(
  templateId: string,
  defaults: {
    deployment_name?: string;
    namespace?: string;
    image?: string;
    containerName?: string;
  }
): TemplateApplicationResult {
  const result = applyTemplate(templateId);

  if (!result.success) {
    return result;
  }

  const { data } = result;

  if (defaults.deployment_name) {
    data.deployment_name = defaults.deployment_name;
  }

  if (defaults.namespace) {
    data.namespace = defaults.namespace;
  }

  if (defaults.image && data.containers && data.containers[0]) {
    data.containers[0].image = defaults.image;
  }

  if (defaults.containerName && data.containers && data.containers[0]) {
    data.containers[0].name = defaults.containerName;
  }

  if (defaults.deployment_name && data.labels) {
    data.labels.app = defaults.deployment_name;
  }

  return result;
}

export function resetToTemplate(templateId: string, currentData: Partial<DeploymentFormData>): Partial<DeploymentFormData> {
  const result = applyTemplate(templateId, currentData);
  return result.data;
}

export function getTemplateFieldSuggestions(templateId: string, fieldPath: string): string[] {
  const template = getTemplateById(templateId);

  if (!template) {
    return [];
  }

  const suggestions: Record<string, string[]> = {
    webApp: {
      image: ['nginx:latest', 'httpd:latest', 'node:18-alpine', 'express:latest'],
      port: ['80', '8080', '3000', '5000'],
      cpu: ['100m', '250m', '500m', '1000m'],
      memory: ['128Mi', '256Mi', '512Mi', '1Gi'],
    },
    apiServer: {
      image: ['node:18-alpine', 'python:3.11-slim', 'golang:1.21-alpine', 'java:17-slim'],
      port: ['3000', '8080', '8000', '9000'],
      cpu: ['100m', '250m', '500m', '1000m'],
      memory: ['256Mi', '512Mi', '1Gi', '2Gi'],
    },
    worker: {
      image: ['python:3.11-slim', 'node:18-alpine', 'golang:1.21-alpine'],
      cpu: ['100m', '250m', '500m'],
      memory: ['128Mi', '256Mi', '512Mi'],
    },
    database: {
      image: ['postgres:15-alpine', 'mysql:8.0', 'redis:7-alpine', 'mongo:6'],
      port: ['5432', '3306', '6379', '27017'],
      cpu: ['250m', '500m', '1000m'],
      memory: ['512Mi', '1Gi', '2Gi', '4Gi'],
    },
  };

  return suggestions[templateId]?.[fieldPath] || [];
}

export function validateTemplateCompatibility(templateId: string, data: Partial<DeploymentFormData>): string[] {
  const issues: string[] = [];
  const template = getTemplateById(templateId);

  if (!template) {
    return issues;
  }

  if (template.id === 'webApp' || template.id === 'apiServer') {
    if (data.service_ports && data.service_ports.length === 0) {
      issues.push('This template expects service ports. Consider adding port mappings.');
    }
  }

  if (template.id === 'database') {
    if (data.volumes && data.volumes.length === 0) {
      issues.push('Database workloads typically require persistent volumes.');
    }
  }

  if (template.id === 'worker') {
    if (data.service_ports && data.service_ports.length > 0) {
      issues.push('Worker templates typically do not expose service ports.');
    }
  }

  return issues;
}

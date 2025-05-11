import yaml from 'js-yaml';
import { QuotaFormValues } from '../types/quota';

// YAML templates for different quota types
export const yamlTemplates = {
  computeQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: my-namespace
spec:
  hard:
    requests.cpu: "1"       # CPU requests limit
    requests.memory: "1Gi"  # Memory requests limit
    limits.cpu: "2"         # CPU limits
    limits.memory: "2Gi"    # Memory limits
    hugepages-2Mi: "100Mi"  # Optional hugepages limit
`,
  storageQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-resources
  namespace: my-namespace
spec:
  hard:
    requests.storage: "100Gi"          # Total storage across all PVCs
    persistentvolumeclaims: "10"       # Max number of PVCs
    
    # Storage class specific limits (optional)
    gold.storageclass.storage.k8s.io/requests.storage: "10Gi"
    gold.storageclass.storage.k8s.io/persistentvolumeclaims: "5"
    
    # For ephemeral storage (if applicable)
    requests.ephemeral-storage: "50Gi"
    limits.ephemeral-storage: "100Gi"
`,
  objectQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-counts
  namespace: my-namespace
spec:
  hard:
    # Core resources
    pods: "10"
    configmaps: "10"
    secrets: "10"
    services: "5"
    services.loadbalancers: "1"
    services.nodeports: "2"
    replicationcontrollers: "5"
    resourcequotas: "2"
    
    # Custom resources using count/<resource>.<group> syntax
    count/deployments.apps: "5"
    count/replicasets.apps: "10"
    count/statefulsets.apps: "5"
    count/jobs.batch: "10"
    count/cronjobs.batch: "5"
`,
  scopes: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota-scopes
  namespace: my-namespace
spec:
  hard:
    pods: "10"
    cpu: "1"
    memory: "1Gi"
  # Choose one scope type - don't mix Terminating/NotTerminating or BestEffort/NotBestEffort
  scopes:
    - "Terminating"        # Or use "NotTerminating"
    - "BestEffort"         # Or use "NotBestEffort"
    
  # Advanced scope selector example
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high"]
    - scopeName: CrossNamespacePodAffinity
      operator: Exists
`,
  priorityClassQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: priority-class-quota
  namespace: my-namespace
spec:
  hard:
    pods: "10"
    cpu: "1"
    memory: "1Gi"
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high"]     # Priority class name
`,
  volumeAttributesClassQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: volume-attributes-quota
  namespace: my-namespace
spec:
  hard:
    requests.storage: "50Gi"
    persistentvolumeclaims: "5"
  scopeSelector:
    matchExpressions:
    - scopeName: VolumeAttributesClass
      operator: In
      values: ["gold"]     # Volume attributes class name
`,
  comprehensive: `# Complete ResourceQuota example with all options
apiVersion: v1
kind: ResourceQuota
metadata:
  name: comprehensive-quota
  namespace: my-namespace
spec:
  hard:
    # Compute resources
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    hugepages-2Mi: "100Mi"
    
    # Storage resources
    requests.storage: "100Gi"
    persistentvolumeclaims: "20"
    gold.storageclass.storage.k8s.io/requests.storage: "50Gi"
    gold.storageclass.storage.k8s.io/persistentvolumeclaims: "10"
    
    # Object counts
    pods: "20"
    configmaps: "50"
    secrets: "30"
    services: "15"
    services.loadbalancers: "2"
    services.nodeports: "5"
    count/deployments.apps: "10"
    count/statefulsets.apps: "5"
    
  # Optional scope selection
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high", "medium"]
`
};

// Helper function to convert form values to YAML
export const formToYaml = (values: QuotaFormValues, namespace: string): string => {
  // If we're preserving original quotas structure and using raw YAML, just return that
  if (values.enableRawYaml && values.rawYaml) {
    return values.rawYaml;
  }

  const quotaDoc: any = {
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    metadata: {
      name: values.quotaName || 'resource-quota',
      namespace: namespace || 'default'
    },
    spec: {
      hard: {} as Record<string, string>
    }
  };

  // Add compute resources
  if (values.computeQuota) {
    if (values.limitsCpu) quotaDoc.spec.hard['limits.cpu'] = values.limitsCpu;
    if (values.limitsMemory) quotaDoc.spec.hard['limits.memory'] = values.limitsMemory;
    if (values.requestsCpu) quotaDoc.spec.hard['requests.cpu'] = values.requestsCpu;
    if (values.requestsMemory) quotaDoc.spec.hard['requests.memory'] = values.requestsMemory;
    if (values.hugepages) quotaDoc.spec.hard['hugepages-2Mi'] = values.hugepages;
  }

  // Add storage resources
  if (values.storageQuota) {
    if (values.requestsStorage) quotaDoc.spec.hard['requests.storage'] = values.requestsStorage;
    if (values.persistentvolumeclaims) quotaDoc.spec.hard['persistentvolumeclaims'] = values.persistentvolumeclaims;

    // Add storage class quotas
    if (values.storageClasses && Array.isArray(values.storageClasses)) {
      values.storageClasses.forEach(sc => {
        if (sc.name && sc.storage) {
          quotaDoc.spec.hard[`${sc.name}.storageclass.storage.k8s.io/requests.storage`] = sc.storage;
        }
        if (sc.name && sc.claims) {
          quotaDoc.spec.hard[`${sc.name}.storageclass.storage.k8s.io/persistentvolumeclaims`] = sc.claims;
        }
      });
    }
  }

  // Add object counts
  if (values.objectQuota) {
    if (values.pods) quotaDoc.spec.hard['pods'] = values.pods;
    if (values.configmaps) quotaDoc.spec.hard['configmaps'] = values.configmaps;
    if (values.secrets) quotaDoc.spec.hard['secrets'] = values.secrets;
    if (values.services) quotaDoc.spec.hard['services'] = values.services;
    if (values.servicesLoadBalancers) quotaDoc.spec.hard['services.loadbalancers'] = values.servicesLoadBalancers;
    if (values.servicesNodePorts) quotaDoc.spec.hard['services.nodeports'] = values.servicesNodePorts;
    if (values.replicationcontrollers) quotaDoc.spec.hard['replicationcontrollers'] = values.replicationcontrollers;
    if (values.resourcequotas) quotaDoc.spec.hard['resourcequotas'] = values.resourcequotas;

    // Add custom object counts
    if (values.customObjectCounts && Array.isArray(values.customObjectCounts)) {
      values.customObjectCounts.forEach(obj => {
        if (obj.resource && obj.count) {
          quotaDoc.spec.hard[`count/${obj.resource}`] = obj.count;
        }
      });
    }
  }

  // Add scopes if needed
  if (values.enableScopes) {
    const scopeSelector = values.scopeSelector;
    if (scopeSelector) {
      const scopes: string[] = [];
      const matchExpressions: any[] = [];

      // Add standard scopes
      if (scopeSelector.terminating) scopes.push('Terminating');
      if (scopeSelector.notTerminating) scopes.push('NotTerminating');
      if (scopeSelector.bestEffort) scopes.push('BestEffort');
      if (scopeSelector.notBestEffort) scopes.push('NotBestEffort');

      // Add cross-namespace pod affinity scope selector
      if (scopeSelector.crossNamespacePodAffinity) {
        matchExpressions.push({
          scopeName: 'CrossNamespacePodAffinity',
          operator: 'Exists'
        });
      }

      // Add priority class scope selector
      if (values.priorityClassQuota && values.priorityClasses?.length > 0) {
        values.priorityClasses.forEach(pc => {
          if (pc.name) {
            matchExpressions.push({
              scopeName: 'PriorityClass',
              operator: 'In',
              values: [pc.name]
            });

            // Add resources for this priority class directly to the hard section
            if (pc.cpu && !quotaDoc.spec.hard['cpu']) quotaDoc.spec.hard['cpu'] = pc.cpu;
            if (pc.memory && !quotaDoc.spec.hard['memory']) quotaDoc.spec.hard['memory'] = pc.memory;
            if (pc.pods && !quotaDoc.spec.hard['pods']) quotaDoc.spec.hard['pods'] = pc.pods;
          }
        });
      }

      // Add volume attributes class scope selector
      if (values.volumeAttributesClassQuota && values.volumeAttributesClasses?.length > 0) {
        values.volumeAttributesClasses.forEach(vac => {
          if (vac.name) {
            matchExpressions.push({
              scopeName: 'VolumeAttributesClass',
              operator: 'In',
              values: [vac.name]
            });

            // Add resources for this volume attributes class directly to the hard section
            if (vac.storage && !quotaDoc.spec.hard['requests.storage']) {
              quotaDoc.spec.hard['requests.storage'] = vac.storage;
            }
            if (vac.claims && !quotaDoc.spec.hard['persistentvolumeclaims']) {
              quotaDoc.spec.hard['persistentvolumeclaims'] = vac.claims;
            }
          }
        });
      }

      // Add scopes and scopeSelector to the quota if they exist
      if (scopes.length > 0) {
        quotaDoc.spec.scopes = scopes;
      }

      if (matchExpressions.length > 0) {
        quotaDoc.spec.scopeSelector = { matchExpressions };
      }
    }
  }

  // Only return the quota if it has resources defined
  if (Object.keys(quotaDoc.spec.hard).length > 0 || quotaDoc.spec.scopes?.length > 0 || quotaDoc.spec.scopeSelector?.matchExpressions?.length > 0) {
    return yaml.dump(quotaDoc);
  } else {
    return ''; // No resources defined
  }
};

// Helper function to parse YAML and update form values for a single ResourceQuota
export const yamlToForm = (yamlString: string): Partial<QuotaFormValues> => {
  try {
    const formValues: Partial<QuotaFormValues> = {
      quotaName: "resource-quota",
      quotaNamespace: "default",
      computeQuota: false,
      storageQuota: false,
      objectQuota: false,
      enableScopes: false,
      priorityClassQuota: false,
      volumeAttributesClassQuota: false,
      storageClasses: [],
      customObjectCounts: [],
      priorityClasses: [],
      volumeAttributesClasses: [],
      scopeSelector: {
        terminating: false,
        notTerminating: false,
        bestEffort: false,
        notBestEffort: false,
        crossNamespacePodAffinity: false,
      },
    };

    try {
      const doc = yaml.load(yamlString) as any;

      if (doc && doc.kind === 'ResourceQuota') {
        formValues.quotaName = doc.metadata?.name || "resource-quota";
        formValues.quotaName = doc.metadata?.namespace || "default";
        const hard = doc.spec?.hard || {};
        const scopes = doc.spec?.scopes || [];
        const scopeSelector = doc.spec?.scopeSelector?.matchExpressions || [];

        // Check for compute resources
        if (Object.keys(hard).some(k => k.includes('cpu') || k.includes('memory') || k.includes('hugepages'))) {
          formValues.computeQuota = true;
          formValues.limitsCpu = hard['limits.cpu'];
          formValues.limitsMemory = hard['limits.memory'];
          formValues.requestsCpu = hard['requests.cpu'];
          formValues.requestsMemory = hard['requests.memory'];

          // Extract hugepages
          Object.keys(hard).forEach(key => {
            if (key.startsWith('hugepages-')) {
              formValues.hugepages = hard[key];
            }
          });
        }

        // Check for storage resources
        if (Object.keys(hard).some(k => k.includes('storage') || k === 'persistentvolumeclaims')) {
          formValues.storageQuota = true;
          formValues.requestsStorage = hard['requests.storage'];
          formValues.persistentvolumeclaims = hard['persistentvolumeclaims'];

          // Extract storage classes
          Object.keys(hard).forEach(key => {
            if (key.includes('.storageclass.storage.k8s.io')) {
              const className = key.split('.')[0];
              const existingClassIndex = formValues.storageClasses.findIndex(sc => sc.name === className);

              if (key.includes('/requests.storage')) {
                if (existingClassIndex !== -1) {
                  formValues.storageClasses[existingClassIndex].storage = hard[key];
                } else {
                  formValues.storageClasses.push({ name: className, storage: hard[key] });
                }
              } else if (key.includes('/persistentvolumeclaims')) {
                if (existingClassIndex !== -1) {
                  formValues.storageClasses[existingClassIndex].claims = hard[key];
                } else {
                  formValues.storageClasses.push({ name: className, claims: hard[key] });
                }
              }
            }
          });
        }

        // Check for object counts
        if (Object.keys(hard).some(k => [
          'pods', 'configmaps', 'secrets', 'services',
          'services.loadbalancers', 'services.nodeports',
          'replicationcontrollers', 'resourcequotas'
        ].includes(k))) {
          formValues.objectQuota = true;
          formValues.pods = hard['pods'];
          formValues.configmaps = hard['configmaps'];
          formValues.secrets = hard['secrets'];
          formValues.services = hard['services'];
          formValues.servicesLoadBalancers = hard['services.loadbalancers'];
          formValues.servicesNodePorts = hard['services.nodeports'];
          formValues.replicationcontrollers = hard['replicationcontrollers'];
          formValues.resourcequotas = hard['resourcequotas'];

          // Extract custom object counts
          Object.keys(hard).forEach(key => {
            if (key.startsWith('count/')) {
              formValues.customObjectCounts.push({
                resource: key.substring(6), // Remove 'count/' prefix
                count: hard[key]
              });
            }
          });
        }

        // Check for scopes
        if (scopes.length > 0 || scopeSelector.length > 0) {
          formValues.enableScopes = true;

          // Handle scopes
          if (scopes.includes('Terminating')) formValues.scopeSelector!.terminating = true;
          if (scopes.includes('NotTerminating')) formValues.scopeSelector!.notTerminating = true;
          if (scopes.includes('BestEffort')) formValues.scopeSelector!.bestEffort = true;
          if (scopes.includes('NotBestEffort')) formValues.scopeSelector!.notBestEffort = true;

          // Handle scope selectors
          scopeSelector.forEach(selector => {
            if (selector.scopeName === 'CrossNamespacePodAffinity') {
              formValues.scopeSelector!.crossNamespacePodAffinity = true;
            } else if (selector.scopeName === 'PriorityClass' && selector.operator === 'In') {
              formValues.priorityClassQuota = true;
              if (selector.values && Array.isArray(selector.values)) {
                selector.values.forEach((className: string) => {
                  const existingClassIndex = formValues.priorityClasses.findIndex(pc => pc.name === className);
                  const newPriorityClass = {
                    name: className,
                    cpu: hard['cpu'] || hard['requests.cpu'],
                    memory: hard['memory'] || hard['requests.memory'],
                    pods: hard['pods']
                  };
                  if (existingClassIndex !== -1) {
                    formValues.priorityClasses[existingClassIndex] = newPriorityClass;
                  } else {
                    formValues.priorityClasses.push(newPriorityClass);
                  }
                });
              }
            } else if (selector.scopeName === 'VolumeAttributesClass' && selector.operator === 'In') {
              formValues.volumeAttributesClassQuota = true;
              if (selector.values && Array.isArray(selector.values)) {
                selector.values.forEach((className: string) => {
                  const existingClassIndex = formValues.volumeAttributesClasses.findIndex(vac => vac.name === className);
                  const newVolumeAttributesClass = {
                    name: className,
                    storage: hard['requests.storage'],
                    claims: hard['persistentvolumeclaims']
                  };
                  if (existingClassIndex !== -1) {
                    formValues.volumeAttributesClasses[existingClassIndex] = newVolumeAttributesClass;
                  } else {
                    formValues.volumeAttributesClasses.push(newVolumeAttributesClass);
                  }
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse YAML", e);
    }

    return formValues;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return {};
  }
};
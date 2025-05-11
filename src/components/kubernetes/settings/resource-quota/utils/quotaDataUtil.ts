import { QuotaFormValues, ResourceQuota } from "@/components/kubernetes/settings/resource-quota/types/quota";
/**
 * Extracts default form values from resource quota objects
 * Works with quotas created both by this application and externally
 */
export const extractQuotaFormValues = (quota: ResourceQuota): Partial<QuotaFormValues> => {
    if (!quota || !Object.keys(quota).length || !quota?.spec?.hard) {
      return {
        quotaName: "resource-quota",
        computeQuota: false,
        storageQuota: false,
        objectQuota: false,
        enableScopes: false,
        priorityClassQuota: false,
        volumeAttributesClassQuota: false,
        enableRawYaml: false,
      };
    }
  
    const defaultValues: Partial<QuotaFormValues> = {
      quotaName: quota?.name || "resource-quota", // Use the first quota's name as default
      quotaNamespace: quota?.namespace || "default", // Use the first quota's name as default
      computeQuota: false,
      storageQuota: false,
      objectQuota: false,
      enableScopes: false,
      priorityClassQuota: false,
      volumeAttributesClassQuota: false,
      enableRawYaml: false,
    };
  
    const specHard = quota.spec.hard;
    const keys = Object.keys(specHard);
    
    // Check for compute resources
    if (keys.some(k => k.includes('cpu') || k.includes('memory'))) {
      defaultValues.computeQuota = true;
      if (specHard['limits.cpu']) defaultValues.limitsCpu = specHard['limits.cpu'];
      if (specHard['limits.memory']) defaultValues.limitsMemory = specHard['limits.memory'];
      if (specHard['requests.cpu']) defaultValues.requestsCpu = specHard['requests.cpu'];
      if (specHard['requests.memory']) defaultValues.requestsMemory = specHard['requests.memory'];
      
      // Check for hugepages
      const hugepagesKey = keys.find(k => k.startsWith('hugepages-'));
      if (hugepagesKey) {
        defaultValues.hugepages = specHard[hugepagesKey];
      }
    }
    
    // Check for storage resources
    if (keys.some(k => k.includes('storage') || k === 'persistentvolumeclaims')) {
      defaultValues.storageQuota = true;
      if (specHard['requests.storage']) defaultValues.requestsStorage = specHard['requests.storage'];
      if (specHard['persistentvolumeclaims']) defaultValues.persistentvolumeclaims = specHard['persistentvolumeclaims'];
      
      // Check for storage classes
      const storageClasses: { name: string; storage?: string; claims?: string }[] = [];
      keys.forEach(key => {
        if (key.includes('.storageclass.storage.k8s.io/requests.storage')) {
          const className = key.split('.')[0];
          const existingClass = storageClasses.find(sc => sc.name === className);
          
          if (existingClass) {
            existingClass.storage = specHard[key];
          } else {
            storageClasses.push({
              name: className,
              storage: specHard[key]
            });
          }
        }
        
        if (key.includes('.storageclass.storage.k8s.io/persistentvolumeclaims')) {
          const className = key.split('.')[0];
          const existingClass = storageClasses.find(sc => sc.name === className);
          
          if (existingClass) {
            existingClass.claims = specHard[key];
          } else {
            storageClasses.push({
              name: className,
              claims: specHard[key]
            });
          }
        }
      });
      
      if (storageClasses.length > 0) {
        defaultValues.storageClasses = storageClasses;
      }
    }
    
    // Check for object count quotas
    const objectCountResources = [
      'configmaps', 'pods', 'secrets', 'services', 
      'services.loadbalancers', 'services.nodeports',
      'replicationcontrollers', 'resourcequotas', 
      'persistentvolumeclaims'
    ];
    
    if (keys.some(k => objectCountResources.includes(k))) {
      defaultValues.objectQuota = true;
      if (specHard['pods']) defaultValues.pods = specHard['pods'];
      if (specHard['configmaps']) defaultValues.configmaps = specHard['configmaps'];
      if (specHard['secrets']) defaultValues.secrets = specHard['secrets'];
      if (specHard['services']) defaultValues.services = specHard['services'];
      if (specHard['services.loadbalancers']) defaultValues.servicesLoadBalancers = specHard['services.loadbalancers'];
      if (specHard['services.nodeports']) defaultValues.servicesNodePorts = specHard['services.nodeports'];
      if (specHard['replicationcontrollers']) defaultValues.replicationcontrollers = specHard['replicationcontrollers'];
      if (specHard['resourcequotas']) defaultValues.resourcequotas = specHard['resourcequotas'];
    }
    
    // Check for custom object counts (count/<resource>.<group>)
    const customObjects: { resource: string; count: string }[] = [];
    keys.forEach(key => {
      if (key.startsWith('count/')) {
        customObjects.push({
          resource: key.substring(6), // remove 'count/' prefix
          count: specHard[key],
        });
      }
    });
    
    if (customObjects.length > 0) {
      defaultValues.customObjectCounts = customObjects;
    }
    
    // Check for scopes and scope selectors
    if (quota.spec.scopes?.length > 0 || quota.spec.scope_selector) {
      defaultValues.enableScopes = true;
      const scopes = quota.spec.scopes || [];
      const scopeSelector = quota.spec.scope_selector?.matchExpressions || [];
      
      defaultValues.scopeSelector = {
        terminating: scopes.includes('Terminating'),
        notTerminating: scopes.includes('NotTerminating'),
        bestEffort: scopes.includes('BestEffort'),
        notBestEffort: scopes.includes('NotBestEffort'),
        crossNamespacePodAffinity: scopeSelector.some(s => s?.scopeName === 'CrossNamespacePodAffinity'),
      };
      
      // Check for priority class and volume attributes class quotas
      if (scopeSelector) {
        const priorityClassExpr = scopeSelector.find(expr => 
          expr?.scopeName === 'PriorityClass' && expr?.operator === 'In'
        );
        
        if (priorityClassExpr) {
          defaultValues.priorityClassQuota = true;
          const priorityClasses: { name: string; cpu?: string; memory?: string; pods?: string }[] = [];
          
          if (priorityClassExpr.values && Array.isArray(priorityClassExpr.values)) {
            priorityClassExpr.values.forEach((className: string) => {
              priorityClasses.push({
                name: className,
                cpu: specHard['cpu'] || specHard['requests.cpu'],
                memory: specHard['memory'] || specHard['requests.memory'],
                pods: specHard['pods'],
              });
            });
            
            if (priorityClasses.length > 0) {
              defaultValues.priorityClasses = priorityClasses;
            }
          }
        }
        
        const volumeAttrClassExpr = scopeSelector.find(expr => 
          expr?.scopeName === 'VolumeAttributesClass' && expr?.operator === 'In'
        );
        
        if (volumeAttrClassExpr) {
          defaultValues.volumeAttributesClassQuota = true;
          const volumeClasses: { name: string; storage?: string; claims?: string }[] = [];
          
          if (volumeAttrClassExpr.values && Array.isArray(volumeAttrClassExpr.values)) {
            volumeAttrClassExpr.values.forEach((className: string) => {
              volumeClasses.push({
                name: className,
                storage: specHard['requests.storage'],
                claims: specHard['persistentvolumeclaims'],
              });
            });
            
            if (volumeClasses.length > 0) {
              defaultValues.volumeAttributesClasses = volumeClasses;
            }
          }
        }
      }
    }
    return defaultValues;
  };
  
  /**
   * Groups quota resources by type for better display in the UI
   */
  export const categorizeQuotaResources = (quota: ResourceQuota) => {
    const { spec, status } = quota;
    const resources = {
      compute: [] as { key: string; used: string; limit: string }[],
      storage: [] as { key: string; used: string; limit: string }[],
      objects: [] as { key: string; used: string; limit: string }[]
    };
  
    if (!spec?.hard || !status?.hard || !status?.used) {
      return resources;
    }
  
    // Process each resource key in the quota
    Object.keys(status.hard).forEach(key => {
      const used = status.used[key] || '0';
      const limit = status.hard[key];
      
      // Categorize by resource type
      if (key.includes('cpu') || key.includes('memory') || key.includes('hugepages')) {
        resources.compute.push({ key, used, limit });
      } else if (key.includes('storage') || key === 'persistentvolumeclaims' || key.includes('storageclass')) {
        resources.storage.push({ key, used, limit });
      } else {
        resources.objects.push({ key, used, limit });
      }
    });
  
    return resources;
  };
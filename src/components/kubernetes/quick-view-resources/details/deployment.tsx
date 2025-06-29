import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-v2';
import { 
  ChevronDown, 
  ChevronRight, 
  Circle, 
  Server, 
  Package, 
  HardDrive,
  FileText,
  Activity,
  Clock,
  Settings,
  Network,
  Database
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// TypeScript interfaces for the API response
interface ContainerInfo {
  name: string;
  image: string;
  ports: Array<{ container_port: number; protocol: string }>;
  env_vars: Array<{ name: string; value?: string; source?: string; secret_name?: string; configmap_name?: string }>;
  resources: { requests: Record<string, string>; limits: Record<string, string> };
  volume_mounts: Array<{ name: string; mount_path: string }>;
}

interface VolumeInfo {
  name: string;
  type?: string;
  secret_name?: string;
  configmap_name?: string;
  claim_name?: string;
  host_path?: string;
}

interface PodInfo {
  pod_name: string;
  status: string;
  node_name?: string;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  containers: ContainerInfo[];
  volumes: VolumeInfo[];
  secrets: string[];
  configmaps: string[];
  persistent_volumes: string[];
  events: Array<{
    type: string;
    reason: string;
    message: string;
    count: number;
    first_timestamp?: string;
    last_timestamp?: string;
  }>;
  restart_count: number;
  ready_containers: number;
  total_containers: number;
}

interface ReplicaSetInfo {
  replicaset_name: string;
  replicas: number;
  available_replicas: number;
  pods: PodInfo[];
  status_color: string;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

interface DeploymentInfo {
  deployment_name: string;
  replicasets: ReplicaSetInfo[];
  secrets: string[];
  persistent_volumes: string[];
  configmaps: string[];
  status_color: string;
  events: Array<{
    type: string;
    reason: string;
    message: string;
    count: number;
    first_timestamp?: string;
    last_timestamp?: string;
    involved_object?: {
      kind: string;
      name: string;
      uid: string;
    };
  }>;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  replicas: number;
  strategy?: {
    type: string;
    max_surge?: string;
    max_unavailable?: string | number;
  };
}

interface ServiceInfo {
  service_name: string;
  type: string;
  cluster_ip: string;
  ports: Array<{ port: number; target_port: number }>;
  selector?: Record<string, string>;
  deployments: DeploymentInfo[];
  ingresses: any[];
}

interface SecretInfo {
  name: string;
  type?: string;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  data_keys: string[];
  string_data_keys: string[];
  error?: string;
}

interface ConfigMapInfo {
  name: string;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  data_keys: string[];
  binary_data_keys: string[];
  error?: string;
}

interface PersistentVolumeInfo {
  name: string;
  status?: string;
  access_modes?: string[];
  storage_class_name?: string;
  capacity?: string;
  volume_name?: string;
  creation_timestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  error?: string;
}

interface DeploymentResponse {
  namespace: string;
  deployment_name?: string;
  ingresses: any[];
  services: ServiceInfo[];
  deployments: DeploymentInfo[];
  secrets: SecretInfo[];
  configmaps: ConfigMapInfo[];
  persistent_volumes: PersistentVolumeInfo[];
  pod_status: string;
  total_expected_replicas: number;
  available_replicas: number;
}

interface DeploymentDetailsProps {
  namespace: string;
  deploymentName: string;
}

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({ namespace, deploymentName }) => {
  const [data, setData] = useState<DeploymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPods, setExpandedPods] = useState<Set<string>>(new Set());
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDeploymentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/kubernertes/deployments?namespace=${encodeURIComponent(namespace)}&deployment_name=${encodeURIComponent(deploymentName)}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deployment data');
      } finally {
        setLoading(false);
      }
    };

    fetchDeploymentData();
  }, [namespace, deploymentName]);

  const togglePodExpansion = (podName: string) => {
    const newExpanded = new Set(expandedPods);
    if (newExpanded.has(podName)) {
      newExpanded.delete(podName);
    } else {
      newExpanded.add(podName);
    }
    setExpandedPods(newExpanded);
  };

  const toggleContainerExpansion = (containerKey: string) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(containerKey)) {
      newExpanded.delete(containerKey);
    } else {
      newExpanded.add(containerKey);
    }
    setExpandedContainers(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
      case 'running':
        return 'bg-green-500';
      case 'yellow':
      case 'pending':
        return 'bg-yellow-500';
      case 'red':
      case 'failed':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatResources = (resources: { requests: Record<string, string>; limits: Record<string, string> }) => {
    const requests = Object.entries(resources.requests).map(([key, value]) => `${key}: ${value}`).join(', ');
    const limits = Object.entries(resources.limits).map(([key, value]) => `${key}: ${value}`).join(', ');
    return { requests: requests || 'None', limits: limits || 'None' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Circle className="h-5 w-5" />
            <span>Error loading deployment: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">No deployment data found</div>
        </CardContent>
      </Card>
    );
  }

  // Get deployment data from services or direct deployments
  const deploymentData = data.services?.[0]?.deployments?.[0] || data.deployments?.[0];
  const serviceData = data.services?.[0];

  if (!deploymentData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Deployment "{deploymentName}" not found in namespace "{namespace}"
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{deploymentData.deployment_name}</h2>
          <p className="text-gray-600">Namespace: {data.namespace}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`border-2 ${getStatusColor(deploymentData.status_color)}`}
          >
            {deploymentData.status_color.toUpperCase()}
          </Badge>
          <Badge variant="secondary">
            {data.available_replicas}/{data.total_expected_replicas} Replicas
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pods">Pods</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Deployment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Deployment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Replicas</label>
                  <p className="text-lg">{deploymentData.replicas}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Strategy</label>
                  <p className="text-lg">{deploymentData.strategy?.type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{formatTimestamp(deploymentData.creation_timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(deploymentData.status_color)}>
                    {deploymentData.status_color}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          {serviceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>Service Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Name</label>
                    <p className="text-lg">{serviceData.service_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-lg">{serviceData.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cluster IP</label>
                    <p className="text-lg font-mono">{serviceData.cluster_ip}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ports</label>
                    <div className="space-y-1">
                      {serviceData.ports.map((port, index) => (
                        <p key={index} className="text-sm">
                          {port.port} → {port.target_port}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ReplicaSet Info */}
          {deploymentData.replicasets.map((rs, rsIndex) => (
            <Card key={rs.replicaset_name}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>ReplicaSet: {rs.replicaset_name}</span>
                  <Badge className={getStatusColor(rs.status_color)}>
                    {rs.status_color}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Replicas</label>
                    <p className="text-lg">{rs.available_replicas}/{rs.replicas}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pods</label>
                    <p className="text-lg">{rs.pods.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm">{formatTimestamp(rs.creation_timestamp)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pods" className="space-y-4">
          {deploymentData.replicasets.map((rs) =>
            rs.pods.map((pod) => (
              <Card key={pod.pod_name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>{pod.pod_name}</span>
                      <Badge className={getStatusColor(pod.status)}>
                        {pod.status}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePodExpansion(pod.pod_name)}
                    >
                      {expandedPods.has(pod.pod_name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Node</label>
                      <p className="text-sm">{pod.node_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Containers</label>
                      <p className="text-sm">{pod.ready_containers}/{pod.total_containers}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Restarts</label>
                      <p className="text-sm">{pod.restart_count}</p>
                    </div>
                  </div>

                  {expandedPods.has(pod.pod_name) && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Containers */}
                      <div>
                        <h4 className="font-medium mb-2">Containers</h4>
                        <div className="space-y-2">
                          {pod.containers.map((container, containerIndex) => {
                            const containerKey = `${pod.pod_name}-${container.name}`;
                            return (
                              <Card key={container.name} className="border-l-4 border-blue-200">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center space-x-2">
                                      <Activity className="h-4 w-4" />
                                      <span>{container.name}</span>
                                    </CardTitle>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleContainerExpansion(containerKey)}
                                    >
                                      {expandedContainers.has(containerKey) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Image</label>
                                      <p className="text-xs font-mono">{container.image}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Ports</label>
                                      <p className="text-xs">
                                        {container.ports.length > 0
                                          ? container.ports.map(p => `${p.container_port}(${p.protocol})`).join(', ')
                                          : 'None'
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  {expandedContainers.has(containerKey) && (
                                    <div className="mt-4 space-y-3 border-t pt-3">
                                      {/* Resources */}
                                      <div>
                                        <label className="text-xs font-medium text-gray-500">Resources</label>
                                        <div className="text-xs space-y-1">
                                          <p><strong>Requests:</strong> {formatResources(container.resources).requests}</p>
                                          <p><strong>Limits:</strong> {formatResources(container.resources).limits}</p>
                                        </div>
                                      </div>

                                      {/* Environment Variables */}
                                      {container.env_vars.length > 0 && (
                                        <div>
                                          <label className="text-xs font-medium text-gray-500">Environment Variables</label>
                                          <div className="text-xs space-y-1">
                                            {container.env_vars.map((env, envIndex) => (
                                              <div key={envIndex} className="flex justify-between">
                                                <span className="font-mono">{env.name}</span>
                                                <span className="text-gray-500">
                                                  {env.value || `${env.source}: ${env.secret_name || env.configmap_name}`}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Volume Mounts */}
                                      {container.volume_mounts.length > 0 && (
                                        <div>
                                          <label className="text-xs font-medium text-gray-500">Volume Mounts</label>
                                          <div className="text-xs space-y-1">
                                            {container.volume_mounts.map((vm, vmIndex) => (
                                              <div key={vmIndex} className="flex justify-between">
                                                <span>{vm.name}</span>
                                                <span className="text-gray-500">{vm.mount_path}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Volumes */}
                      {pod.volumes.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Volumes</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {pod.volumes.map((volume, volumeIndex) => (
                              <div key={volumeIndex} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="font-medium">{volume.name}</div>
                                <div className="text-gray-500">{volume.type || 'N/A'}</div>
                                {volume.configmap_name && (
                                  <div className="text-blue-600">ConfigMap: {volume.configmap_name}</div>
                                )}
                                {volume.secret_name && (
                                  <div className="text-red-600">Secret: {volume.secret_name}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {/* Secrets */}
          {data.secrets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Secrets ({data.secrets.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.secrets.map((secret) => (
                    <div key={secret.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{secret.name}</div>
                        <div className="text-sm text-gray-500">{secret.type || 'N/A'}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {secret.data_keys.length} keys
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ConfigMaps */}
          {data.configmaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>ConfigMaps ({data.configmaps.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.configmaps.map((configmap) => (
                    <div key={configmap.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{configmap.name}</div>
                        <div className="text-sm text-gray-500">
                          Created: {formatTimestamp(configmap.creation_timestamp)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {configmap.data_keys.length} keys
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Persistent Volumes */}
          {data.persistent_volumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Persistent Volumes ({data.persistent_volumes.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.persistent_volumes.map((pvc) => (
                    <div key={pvc.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{pvc.name}</div>
                        <div className="text-sm text-gray-500">
                          Status: {pvc.status || 'N/A'} | Class: {pvc.storage_class_name || 'N/A'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {pvc.capacity || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.secrets.length === 0 && data.configmaps.length === 0 && data.persistent_volumes.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">No resources found</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Deployment Events */}
          {deploymentData.events.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Deployment Events ({deploymentData.events.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deploymentData.events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <Circle className={`h-3 w-3 mt-1 ${getStatusColor(event.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{event.reason}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(event.last_timestamp)} (Count: {event.count})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">No events found</div>
              </CardContent>
            </Card>
          )}

          {/* Pod Events */}
          {deploymentData.replicasets.some(rs => rs.pods.some(pod => pod.events.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pod Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentData.replicasets.map((rs) =>
                    rs.pods.map((pod) =>
                      pod.events.length > 0 ? (
                        <div key={pod.pod_name}>
                          <h4 className="font-medium mb-2">{pod.pod_name}</h4>
                          <div className="space-y-2">
                            {pod.events.map((event, index) => (
                              <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                                <Circle className={`h-2 w-2 mt-1 ${getStatusColor(event.type)}`} />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">{event.reason}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {event.type}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{event.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentDetails;

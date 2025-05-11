import React, { useState } from 'react';
import { 
  Globe2, 
  Server, 
  Box, 
  Copy, 
  Cpu,
  Network,
  Clock,
  Activity,
  Layers,
  HardDrive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ResourceFlowProps {
  deployment: any;
}

export const ResourceFlow: React.FC<ResourceFlowProps> = ({ deployment }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const renderDetailCard = (
    id: string,
    title: string,
    icon: React.ReactNode,
    details: React.ReactNode,
    color: string
  ) => (
    <div className="relative">
      <div 
        className={`w-full rounded-lg shadow-md transition-all duration-300 cursor-pointer
          ${expandedCard === id ? 'mb-4' : 'mb-8'}`}
        style={{ backgroundColor: color }}
      >
        <div 
          className="p-4 flex items-center justify-between"
          onClick={() => toggleCard(id)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          {expandedCard === id ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
        {expandedCard === id && (
          <div className="px-4 pb-4 border-t border-gray-200">
            {details}
          </div>
        )}
      </div>
    </div>
  );

  const renderIngress = () => {
    const ingressDetails = deployment.services.flatMap(svc => 
      svc.ingresses?.map(ing => (
        <div key={ing.host} className="py-2">
          <div className="flex items-center gap-2 text-sm">
            <Globe2 className="h-4 w-4" />
            <span className="font-medium">Host:</span> {ing.host}
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <Network className="h-4 w-4" />
            <span className="font-medium">Path:</span> {ing.path}
          </div>
        </div>
      )) || []
    );
    if(!ingressDetails.length) return null
    return renderDetailCard(
      'ingress',
      'Ingress',
      <Globe2 className="h-6 w-6 text-blue-600" />,
      ingressDetails,
      '#e6f3ff'
    );
  };

  const renderService = () => {
    const serviceDetails = deployment.services.map(svc => (
      <div key={svc.service_name} className="py-2">
        <div className="flex items-center gap-2 text-sm">
          <Server className="h-4 w-4" />
          <span className="font-medium">Name:</span> {svc.service_name}
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <Network className="h-4 w-4" />
          <span className="font-medium">Type:</span> {svc.type}
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <HardDrive className="h-4 w-4" />
          <span className="font-medium">Cluster IP:</span> {svc.cluster_ip}
        </div>
      </div>
    ));
    if(!serviceDetails.length) return null

    return renderDetailCard(
      'service',
      'Service',
      <Server className="h-6 w-6 text-purple-600" />,
      serviceDetails,
      '#f3e8ff'
    );
  };

  const renderDeployment = () => {
    return renderDetailCard(
      'deployment',
      'Deployment',
      <Box className="h-6 w-6 text-green-600" />,
      <div className="py-2">
        <div className="flex items-center gap-2 text-sm">
          <Box className="h-4 w-4" />
          <span className="font-medium">Name:</span> {deployment.deployment_name}
        </div>
        {deployment.conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mt-1">
            <Activity className="h-4 w-4" />
            <span className="font-medium">Condition:</span> {JSON.stringify(condition)}
          </div>
        ))}
      </div>,
      '#ecfdf5'
    );
  };

  const renderReplicaSet = () => {
    const replicaSetDetails = deployment.replicasets.map(rs => (
      <div key={rs.replicaset_name} className="py-2">
        <div className="flex items-center gap-2 text-sm">
          <Copy className="h-4 w-4" />
          <span className="font-medium">Name:</span> {rs.replicaset_name}
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <Layers className="h-4 w-4" />
          <span className="font-medium">Replicas:</span> {rs.available_replicas}/{rs.replicas}
        </div>
      </div>
    ));
    if(!replicaSetDetails.length) return null

    return renderDetailCard(
      'replicaset',
      'ReplicaSet',
      <Copy className="h-6 w-6 text-orange-600" />,
      replicaSetDetails,
      '#fff7ed'
    );
  };

  const renderPods = () => {
    const podDetails = deployment.pods.map(pod => (
      <div key={pod.pod_name} className="py-2">
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4" />
          <span className="font-medium">Name:</span> {pod.pod_name}
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <Activity className="h-4 w-4" />
          <span className="font-medium">Status:</span> {pod.status}
        </div>
        {pod.node_name && (
          <div className="flex items-center gap-2 text-sm mt-1">
            <Server className="h-4 w-4" />
            <span className="font-medium">Node:</span> {pod.node_name}
          </div>
        )}
        {pod.container_statuses.map((container, index) => (
          <div key={index} className="mt-2 pl-4 border-l-2 border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Box className="h-4 w-4" />
              <span className="font-medium">Container:</span> {container.name}
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Restarts:</span> {container.restart_count}
            </div>
          </div>
        ))}
      </div>
    ));
    if(!podDetails.length) return null

    return renderDetailCard(
      'pods',
      'Pods',
      <Cpu className="h-6 w-6 text-red-600" />,
      podDetails,
      '#fef2f2'
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderIngress()}
      {renderService()}
      {renderDeployment()}
      {renderReplicaSet()}
      {renderPods()}
    </div>
  );
};
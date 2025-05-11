import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams } from 'react-router-dom';
import { DeploymentList } from '@/components/kubernetes/DeploymentList';
import { PodTable } from '@/components/kubernetes/PodTable';
import { ConfigMapTable } from '@/components/kubernetes/ConfigMapTable';
import KubernetesIngressList from "@/components/kubernetes/Ingress";
import KubernetesCertificateList from "@/components/kubernetes/certificates";
import KubernetesIssuerList from "@/components/kubernetes/issuer";
import KubernetesSecretList from "@/components/kubernetes/secrets";
import { ServiceList } from '@/components/kubernetes/SerivceList';
import ResourceTable from '@/components/kubernetes/ResourceTable';
import { DefaultService } from '@/gingerJs_api_client';
import useNavigate from '@/libs/navigate';
import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext';
import { JobList } from '@/components/JobList';
import KubernetesNodesList from '@/components/kubernetes/NodesInfo';
import CustomLink from '@/libs/Link';
import { StatefulSetTable } from '@/components/kubernetes/resources/StatefulSetTable';
import { CronJobTable } from '@/components/kubernetes/resources/CronJobTable';
import { NetworkPolicyTable } from '@/components/kubernetes/resources/NetworkPolicyTable';
import { PersistentVolumeTable } from '@/components/kubernetes/resources/PersistentVolumeTable';
import { PersistentVolumeClaimTable } from '@/components/kubernetes/resources/PersistentVolumeClaimTable';
import { RoleTable } from '@/components/kubernetes/resources/RoleTable';
import { StorageClassTable } from '@/components/kubernetes/resources/StorageClassTable';
import { EndpointsTable } from '@/components/kubernetes/resources/EndpointsTable';
import { ServiceAccountTable } from '@/components/kubernetes/resources/ServiceAccountTable';
import { RoleBindingTable } from '@/components/kubernetes/resources/RoleBindingTable';
import { CustomResourceDefinitionTable } from '@/components/kubernetes/resources/CustomResourceDefinitionTable';
import SmartDataViewer from '@/components/queues/queueJob/SmartDataViewer';
import Events from '@/components/kubernetes/resources/events';

export default function ResourceTypePage() {
  const { resourceType } = useParams();
  const {isLoading:isNamespacesLoading,selectedNamespace} = useContext(NamespaceContext)
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResources = async () => {
      if (!resourceType || isNamespacesLoading) return;
      
      setIsLoading(true);
      try {
        const result = await DefaultService.apiKubernertesResourcesTypeGet({
          type: resourceType,
          namespace: selectedNamespace
        });
        
        setResources(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        setError("Failed to fetch resources")
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [resourceType,isNamespacesLoading,selectedNamespace]);

  const renderResourceView = () => {
    if (isLoading) {
      return (
        <Card className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Card>
      );
    }

    switch (resourceType?.toLowerCase()) {
      case 'daemonsets':
      case 'replicasets':
      case 'deployments':
        return <DeploymentList deployments={resources} />;
      case 'jobs':
        return <JobList jobs={resources} onRetry={() => {}} onDelete={() => {} } />;
      case 'nodes':
        return <KubernetesNodesList items={resources} />;
      case 'pods':
        return <PodTable pods={resources} onEdit={() => {}} onDelete={() => {}} />;
      case 'configmaps':
        return <ConfigMapTable configMaps={resources} onEdit={() => {}} onDelete={() => {}} />;
      case 'secrets':
        return <KubernetesSecretList items={resources} />;
      case 'services':
        return <ServiceList services={resources} />;
      case 'ingresses':
        return <KubernetesIngressList ingressList={resources} />;
      case 'certificates':
        return <KubernetesCertificateList items={resources} />;
      case 'issuers':
        return <KubernetesIssuerList items={resources} />;
      case 'statefulsets':
        return <StatefulSetTable resources={resources} />;
      case 'cronjobs':
        return <CronJobTable resources={resources} />;
      case 'networkpolicies':
        return <NetworkPolicyTable resources={resources} />;
      case 'persistentvolumes':
        return <PersistentVolumeTable resources={resources} />;
      case 'persistentvolumeclaims':
        return <PersistentVolumeClaimTable resources={resources} />;
      case 'roles':
      case 'clusterroles':
        return <RoleTable resources={resources} />;
      case 'storageclasses':
        return <StorageClassTable resources={resources} />;
      case 'endpoints':
        return <EndpointsTable resources={resources} />;
      case 'serviceaccounts':
        return <ServiceAccountTable resources={resources} />;
      case 'rolebindings':
      case 'clusterrolebindings':
        return <RoleBindingTable resources={resources} />;
      case 'customresourcedefinitions':
      case 'crds':
        return <CustomResourceDefinitionTable resources={resources} />;
      case 'events':
        return (
            <Events events={resources} isLoading={isLoading} error={error} />
        );
      default:
        // Default table view for other resources
        const columns = [
          { key: 'metadata.name', header: 'Name' },
          // { key: 'metadata.namespace', header: 'Namespace' },
          { key: 'metadata.creationTimestamp', header: 'Created' },
        ];
        return (
          <ResourceTable
            resources={resources}
            columns={columns}
          />
        );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <CustomLink onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate('/orchestration/kubernetes/namespaced/resources')
      }} href="/orchestration/kubernetes/namespaced/resources">
        <Button
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>
      </CustomLink>
      
      {renderResourceView()}
    </div>
  );
} 
import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useParams } from 'react-router-dom';
import { DeploymentList } from '@/components/kubernetes/quick-view-resources/DeploymentList';
import { PodTable } from '@/components/kubernetes/PodTable';
import { ConfigMapTable } from '@/components/kubernetes/ConfigMapTable';
import KubernetesIngressList from "@/components/kubernetes/Ingress";
import KubernetesCertificateList from "@/components/kubernetes/certificates";
import KubernetesIssuerList from "@/components/kubernetes/issuer";
import KubernetesSecretList from "@/components/kubernetes/secrets";
import { ServiceList } from '@/components/kubernetes/SerivceList';
import { DefaultService } from '@/gingerJs_api_client';
import useNavigate from '@/libs/navigate';
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext';
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
import {ResourceTable} from '@/components/kubernetes/resources/resourceTable';
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector';
import RouteDescription from '@/components/route-description';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ResourceTypePage() {
  const { resourceType } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
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

  const _columns = Object.keys((!isLoading && resources.length) ? resources[0].metadata : {}).reduce((acc, item) => {
    if(["managedfields","labels","annotations","uid","resourceversion"].includes(item.toLowerCase())) return acc
    acc.push({accessor:`metadata.${item}`,header:item.toUpperCase()})
    return acc
  },[] as {header: string; accessor: string}[])

  const filteredResources =
  resources?.filter(
      (resource) =>
        resource.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if(error){
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <RouteDescription
          title={`Resource Type: ${resourceType}`}
          shortDescription={`${resources.length} found`}
          description={`View and manage all ${resourceType} in your cluster. Click on any resource to view detailed information including metadata, labels, and configuration.`}
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your {resourceType}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search ${resourceType}...`}
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ResourceTable columns={_columns} data={filteredResources} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
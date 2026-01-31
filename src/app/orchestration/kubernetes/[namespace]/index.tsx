


import React, { useCallback, useContext, useEffect, useState } from "react";
import useKubernertesResources from "@/hooks/use-resource";
import {
  Globe,
  Share2Icon,
  RocketIcon,
  BoxIcon,
  FileKeyIcon,
  NetworkIcon,
  ShieldIcon,
  BadgeIcon as Certificate,
  HandCoinsIcon,
  Plus,
} from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import Events from "@/components/kubernetes/resources/events";
import ClusterInfo from "@/components/kubernetes/dashboard/clusterInfo";
import ClusterMetrics from "@/components/kubernetes/dashboard/clusterMatrics";
import RouteDescription from "@/components/route-description";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useNavigate from "@/libs/navigate";
import { Button } from "@/components/ui/button";
import ApplyResourceDialog from '@/components/kubernetes/applyResource/ApplyResourceDialog';
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext"
import PageLayout from "@/components/PageLayout";;
import { useParams } from "react-router-dom";

const shortcutToResources = {
  deployment: {
    id: "deployments",
    title: "Deployments",
    icon: <RocketIcon size={20} color="white" />,
    color: "bg-blue-500",
  },
  pod: {
    id: "pods",
    title: "Pods",
    icon: <BoxIcon size={20} color="white" />,
    color: "bg-green-500",
  },
  configmap: {
    id: "configmaps",
    title: "ConfigMaps",
    icon: <ShieldIcon size={20} color="white" />,
    color: "bg-indigo-500",
  },
  secret: {
    id: "secrets",
    title: "Secrets",
    icon: <FileKeyIcon size={20} color="white" />,
    color: "bg-purple-500",
  },
  service: {
    id: "services",
    title: "Services",
    icon: <NetworkIcon size={20} color="white" />,
    color: "bg-orange-500",
  },
  ingress: {
    id: "ingresses",
    title: "Ingress",
    icon: <Globe size={20} color="white" />,
    color: "bg-yellow-500",
  },
  certificate: {
    id: "certificates",
    title: "Certificates",
    icon: <Certificate size={20} color="white" />,
    color: "bg-teal-500",
  },
  issuer: {
    id: "issuers",
    title: "Issuers",
    icon: <HandCoinsIcon size={20} color="white" />,
    color: "bg-red-500",
  },
};

function Kubernetes() {
  const navigate = useNavigate()
  const [showApplyResouceFormm, setShowApplyResourceForm] = useState(false)
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [clusterInfo, setClusterInfo] = useState<any>({});
  const [isLoadingClusterInfo, setIsLoadingClusterInfo] = useState(true);
  const [clusterInfoError, setClusterInfoError] = useState("");

  const [clusterMetrics, setClusterMetrics] = useState<any>({});
  const [isLoadingClusterMetrics, setIsLoadingClusterMetrics] = useState(true);
  const [clusterMetricsError, setClusterMetricsError] = useState("");

  const { namespace } = useParams()

  const {
    error: recentEventsError,
    resource: recentEvents,
    isLoading: isRecentEventsLoading,
  } = useKubernertesResources({
    nameSpace: (namespace as any) || null,
    type: "events",
  });

  const fetchClusterInfo = useCallback(async () => {
    setIsLoadingClusterInfo(true);
    const response: any = await DefaultService.apiKubernertesClusterGet().catch(
      (err) => {
        setClusterInfoError("Unable to fetch cluster info");
      }
    );
    if (response && response.status != "error") {
      setClusterInfo(response.data);
      setIsLoadingClusterInfo(false);
    }
  }, []);

  const fetchClusterMetrics = useCallback(async () => {
    setIsLoadingClusterMetrics(true);
    const response: any = await DefaultService.apiKubernertesClusterMetricsGet().catch(
      (err) => {
        setClusterMetricsError("Unable to fetch cluster info");
      }
    );
    if (response && response.status != "error") {
      setClusterMetrics(response.data);
      setIsLoadingClusterMetrics(false);
    }
  }, []);

  const fetchShortcutToResourcesData = useCallback(async () => {
    setIsLoading(true);
    const response: any = await DefaultService.apiKubernertesResourcesGet({
      scope: (namespace as any) || null,
      resources: Object.keys(shortcutToResources).join(","),
    }).catch((err) => {
      setError("Unable to fetch ResourceData");

    });
    setResources(response as []);
    setIsLoading(false);
  }, [namespace]);

  useEffect(() => {
    fetchShortcutToResourcesData();
    fetchClusterInfo();
    fetchClusterMetrics()
  }, []);

  return (
    <PageLayout
      title="Kubernetes"
      subtitle="Monitor and manage your cluster resources from this central hub."
      icon={Globe}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={"outline"}
            className=""
            onClick={() => {
              navigate(`/orchestration/kubernetes/${namespace}/flow`);
            }}
          >
            <Share2Icon className="mr-2 h-4 w-4" />
            View Cluster Flow
          </Button>
          <Button
            className=""
            onClick={() => {
              setShowApplyResourceForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Apply Resource file
          </Button>
        </div>
      }
    >
      <ApplyResourceDialog open={showApplyResouceFormm} onClose={() => setShowApplyResourceForm(false)} />
      <div className="space-y-6">
        <Card className="rounded-xl border border-border/50">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Quickly navigate to your most used resource
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(isLoading || error) && (
                <>
                  {Object.values(shortcutToResources).map((item) => {
                    return (
                      <ResourceCard
                        key={item.id}
                        title={item.title}
                        count={0}
                        color={item.color}
                        icon={item.icon}
                        onClick={() => { }}
                        isLoading={isLoading}
                        error={!!error}
                      />
                    );
                  })}
                </>
              )}
              {!isLoading && !error && (
                <>
                  {resources?.map((resource: Record<string, any>) => (
                    <ResourceCard
                      key={resource.kind}
                      title={
                        shortcutToResources[
                          resource.kind.toLowerCase() as keyof typeof shortcutToResources
                        ].title
                      }
                      count={resource.count}
                      icon={
                        shortcutToResources[
                          resource.kind.toLowerCase() as keyof typeof shortcutToResources
                        ].icon
                      }
                      color={
                        shortcutToResources[
                          resource.kind.toLowerCase() as keyof typeof shortcutToResources
                        ].color
                      }
                      onClick={() => {
                        const resourceType =
                          shortcutToResources[
                            resource.kind.toLowerCase() as keyof typeof shortcutToResources
                          ].id;
                        navigate(
                          `/orchestration/kubernetes/${namespace}/${resourceType}`
                        );
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 grid gap-6">
            <ClusterInfo
              isLoading={isLoadingClusterInfo}
              error={clusterInfoError}
              nodesCount={clusterInfo?.nodes_count || 0}
              podsCount={clusterInfo?.pods_count || 0}
              runningPods={clusterInfo?.running_pods || 0}
              namespacesCount={clusterInfo?.namespaces_count || 0}
            />
            <Events
              events={recentEvents}
              isLoading={isRecentEventsLoading}
              error={recentEventsError || ""}
            />
          </div>
          <div className="col-span-1">
            <ClusterMetrics
              isLoading={isLoadingClusterMetrics}
              error={clusterMetricsError}
              usage={{
                cpu: clusterMetrics?.usage?.cpu?.percentage,
                memory: clusterMetrics?.usage?.memory?.percentage,
                disk: clusterMetrics?.usage?.disk?.percentage,
              }}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Kubernetes;



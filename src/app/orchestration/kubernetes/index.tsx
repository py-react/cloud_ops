import React, { useCallback, useEffect, useState } from "react";
import useKubernertesResources from "@/hooks/use-resource";
import {
  Layers,
  Box,
  FileText,
  Lock,
  Share2,
  Globe,
  Shield,
  KeyRound,
  Loader2,
} from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { DefaultService } from "@/gingerJs_api_client";
import Events from "@/components/kubernetes/resources/events";
import ClusterInfo from "@/components/kubernetes/dashboard/clusterInfo";
import ClusterMetrics from "@/components/kubernetes/dashboard/clusterMatrics";

const shortcutToResources = {
  deployment: {
    id: "deployment",
    title: "Deployments",
    icon: <Layers size={20} color="white" />,
    color: "bg-blue-500",
  },
  pod: {
    id: "pod",
    title: "Pods",
    icon: <Box size={20} color="white" />,
    color: "bg-green-500",
  },
  configmap: {
    id: "configmap",
    title: "ConfigMaps",
    icon: <FileText size={20} color="white" />,
    color: "bg-indigo-500",
  },
  secret: {
    id: "secret",
    title: "Secrets",
    icon: <Lock size={20} color="white" />,
    color: "bg-purple-500",
  },
  service: {
    id: "service",
    title: "Services",
    icon: <Share2 size={20} color="white" />,
    color: "bg-orange-500",
  },
  ingress: {
    id: "ingress",
    title: "Ingress",
    icon: <Globe size={20} color="white" />,
    color: "bg-yellow-500",
  },
  certificate: {
    id: "certificate",
    title: "Certificates",
    icon: <Shield size={20} color="white" />,
    color: "bg-teal-500",
  },
  issuer: {
    id: "issuer",
    title: "Issuers",
    icon: <KeyRound size={20} color="white" />,
    color: "bg-red-500",
  },
};

function Kubernetes() {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [clusterInfo, setCLusterInfo] = useState({});
  const [isLoadingClusterInfo, setIsLoadingClusterInfo] = useState(true);
  const [clusterInfoError, setClusterInfoError] = useState("");

  const [clusterMettrics, setCLusterMetrics] = useState({});
  const [isLoadingClusterMetrics, setIsLoadingClusterMetrics] = useState(true);
  const [clusterMetricsError, setClusterMetricsError] = useState("");

  const {
    error: recentEventsError,
    resource: recentEvents,
    isLoading: isRecentEventsLoading,
  } = useKubernertesResources({
    nameSpace: null,
    type: "events",
  });

  const fetchClusterInfo = useCallback(async () => {
    setIsLoadingClusterInfo(true);
    const response = await DefaultService.apiKubernertesClusterGet().catch(
      (err) => {
        setClusterInfoError("Unable to fetch cluster info");
      }
    );
    if (response.status != "error") {
      setCLusterInfo(response.data);
      setIsLoadingClusterInfo(false);
    }
  }, []);

  const fetchClusterMetrics = useCallback(async () => {
    setIsLoadingClusterMetrics(true);
    const response = await DefaultService.apiKubernertesClusterMetricsGet().catch(
      (err) => {
        setClusterMetricsError("Unable to fetch cluster info");
      }
    );
    if (response.status != "error") {
      setCLusterMetrics(response.data);
      setIsLoadingClusterMetrics(false);
    }
  }, []);

  const fetchShortcutToResourcesData = useCallback(async () => {
    setIsLoading(true);
    const response = await DefaultService.apiKubernertesResourcesGet({
      scope: null,
      resources: Object.keys(shortcutToResources).join(","),
    }).catch((err) => {
      setError("Unable to fetch ResourceData");

    });
    setResources(response as []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchShortcutToResourcesData();
    fetchClusterInfo();
    fetchClusterMetrics()
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Kubernetes Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
                  onClick={() => {}}
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
                onClick={() => {}}
              />
            ))}
          </>
        )}
      </div>
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
          ;
        </div>
        <div className="col-span-1">
          <ClusterMetrics
            isLoading={isLoadingClusterMetrics}
            error={clusterMetricsError}
            usage={{
              cpu: clusterMettrics?.usage?.cpu?.percentage,
              memory: clusterMettrics?.usage?.memory?.percentage,
              disk: clusterMettrics?.usage?.disk?.percentage,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Kubernetes;

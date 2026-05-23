


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
import { PodHealthChart } from "@/components/kubernetes/namespace/PodHealthChart";
import { NamespacePerformance } from "@/components/kubernetes/namespace/NamespacePerformance";
import { NamespaceActivity } from "@/components/kubernetes/namespace/NamespaceActivity";
import { NamespaceWorkloadLedger } from "@/components/kubernetes/namespace/NamespaceWorkloadLedger";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useNavigate from "@/libs/navigate";
import { Button } from "@/components/ui/button";
import ApplyResourceDialog from '@/components/kubernetes/applyResource/ApplyResourceDialog';
import { KubeErrorState } from "@/components/kubernetes/KubeErrorState";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext"
import PageLayout from "@/components/PageLayout";
import { useParams } from "react-router-dom";

const shortcutToResources = {
  deployment: {
    id: "deployments",
    title: "Deployments",
    icon: <RocketIcon size={20} color="white" />,
    color: "bg-blue-500",
    className: "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30 transition-all shadow-none",
  },
  pod: {
    id: "pods",
    title: "Pods",
    icon: <BoxIcon size={20} color="white" />,
    color: "bg-green-500",
    className: "bg-green-500/5 border-green-500/10 hover:border-green-500/30 transition-all shadow-none",
  },
  configmap: {
    id: "configmaps",
    title: "ConfigMaps",
    icon: <ShieldIcon size={20} color="white" />,
    color: "bg-indigo-500",
    className: "bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30 transition-all shadow-none",
  },
  secret: {
    id: "secrets",
    title: "Secrets",
    icon: <FileKeyIcon size={20} color="white" />,
    color: "bg-purple-500",
    className: "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/30 transition-all shadow-none",
  },
  service: {
    id: "services",
    title: "Services",
    icon: <NetworkIcon size={20} color="white" />,
    color: "bg-orange-500",
    className: "bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30 transition-all shadow-none",
  },
};

function Kubernetes() {
  const navigate = useNavigate()
  const [showApplyResouceFormm, setShowApplyResourceForm] = useState(false)
  const { namespace } = useParams()
  const [nsDetails, setNsDetails] = useState<any>(null);
  const [isLoadingNsDetails, setIsLoadingNsDetails] = useState(true);
  const [nsMetrics, setNsMetrics] = useState<any>(null);
  const [isLoadingNsMetrics, setIsLoadingNsMetrics] = useState(true);

  const {
    error: recentEventsError,
    resource: recentEvents,
    isLoading: isRecentEventsLoading,
    isConfigMissing,
  } = useKubernertesResources({
    nameSpace: (namespace as any) || null,
    type: "events",
  });

  const fetchNamespaceDetails = useCallback(async () => {
    setIsLoadingNsDetails(true);
    try {
      const response = await fetch(`/api/kubernertes/namespaces/${namespace}`);
      const result = await response.json();
      if (result.status === "success") {
        setNsDetails(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch ns details", e);
    } finally {
      setIsLoadingNsDetails(false);
    }
  }, [namespace]);

  const fetchNamespaceMetrics = useCallback(async () => {
    setIsLoadingNsMetrics(true);
    try {
      const response = await fetch(`/api/kubernertes/cluster/metrics/namespace/${namespace}`);
      const result = await response.json();
      if (result.status === "success") {
        setNsMetrics(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch ns metrics", e);
    } finally {
      setIsLoadingNsMetrics(false);
    }
  }, [namespace]);

  useEffect(() => {
    fetchNamespaceDetails();
    fetchNamespaceMetrics();
  }, [namespace]);

  if (isConfigMissing || recentEventsError === "No active Kubernetes configuration found") {
    return <KubeErrorState error={recentEventsError || "No active Kubernetes configuration found"} isConfigMissing={true} />;
  }

  return (
    <PageLayout
      title={`Namespace: ${namespace}`}
      subtitle={`Comprehensive resource monitoring and management for the ${namespace} environment.`}
      icon={Globe}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector className="w-[200px]" />
          <Button
            variant={"outline"}
            size="sm"
            className="h-9"
            onClick={() => {
              navigate(`/orchestration/kubernetes/${namespace}/flow`);
            }}
          >
            <Share2Icon className="mr-2 h-4 w-4" />
            View Cluster Flow
          </Button>
          <Button
            size="sm"
            className="h-9"
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
        {/* --- Hero Navigation Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ResourceCard
            title="Pods"
            count={nsDetails?.resource_counts?.pods || 0}
            icon={shortcutToResources.pod.icon}
            color={shortcutToResources.pod.color}
            className={shortcutToResources.pod.className}
            isLoading={isLoadingNsDetails}
            onClick={() => navigate(`/orchestration/kubernetes/${namespace}/pods`)}
          />
          <ResourceCard
            title="Deployments"
            count={nsDetails?.resource_counts?.deployments || 0}
            icon={shortcutToResources.deployment.icon}
            color={shortcutToResources.deployment.color}
            className={shortcutToResources.deployment.className}
            isLoading={isLoadingNsDetails}
            onClick={() => navigate(`/orchestration/kubernetes/${namespace}/deployments`)}
          />
          <ResourceCard
            title="Services"
            count={nsDetails?.resource_counts?.services || 0}
            icon={shortcutToResources.service.icon}
            color={shortcutToResources.service.color}
            className={shortcutToResources.service.className}
            isLoading={isLoadingNsDetails}
            onClick={() => navigate(`/orchestration/kubernetes/${namespace}/services`)}
          />
          <ResourceCard
            title="ConfigMaps"
            count={nsDetails?.resource_counts?.configmaps || 0}
            icon={shortcutToResources.configmap.icon}
            color={shortcutToResources.configmap.color}
            className={shortcutToResources.configmap.className}
            isLoading={isLoadingNsDetails}
            onClick={() => navigate(`/orchestration/kubernetes/${namespace}/configmaps`)}
          />
          <ResourceCard
            title="Secrets"
            count={nsDetails?.resource_counts?.secrets || 0}
            icon={shortcutToResources.secret.icon}
            color={shortcutToResources.secret.color}
            className={shortcutToResources.secret.className}
            isLoading={isLoadingNsDetails}
            onClick={() => navigate(`/orchestration/kubernetes/${namespace}/secrets`)}
          />
        </div>

        {/* --- Main Dashboard Infrastructure Matrix --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Content Column: Health & Performance */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PodHealthChart
                data={{
                  Running: nsDetails?.resource_counts?.pod_status_breakdown?.Running || 0,
                  Pending: nsDetails?.resource_counts?.pod_status_breakdown?.Pending || 0,
                  Failed: nsDetails?.resource_counts?.pod_status_breakdown?.Failed || 0,
                  Succeeded: nsDetails?.resource_counts?.pod_status_breakdown?.Succeeded || 0,
                  total: nsDetails?.resource_counts?.pods || 0
                }}
                isLoading={isLoadingNsDetails}
              />
              <NamespacePerformance
                data={nsMetrics}
                isLoading={isLoadingNsMetrics}
              />
            </div>

            <NamespaceWorkloadLedger />
          </div>

          {/* Right Content Column: Identity & Activity Feed */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-[600px]">
            {/* Condensed Metadata Card */}
            <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden border-primary/10">
              <CardHeader className="py-3 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Namespace Context
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Status</span>
                  <p className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {nsDetails?.status?.phase || "Active"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Version</span>
                  <p className="text-xs font-bold text-foreground">v1.28.x</p>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Creation Authority</span>
                  <p className="text-[11px] font-medium text-muted-foreground italic truncate">
                    {nsDetails?.metadata?.creation_timestamp ? new Date(nsDetails.metadata.creation_timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* The Detailed Activity Component */}
            <NamespaceActivity
              events={recentEvents}
              isLoading={isRecentEventsLoading}
              error={recentEventsError}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Kubernetes;



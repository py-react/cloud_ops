import React, { useMemo } from "react";
import {
  Rocket,
  Layers,
  Box,
  Network,
  Clock,
  AlertCircle,
  ExternalLink,
  Zap,
  ShieldCheck
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";
import { useKubernertesResources } from "@/hooks/use-resource";
import { formatDistanceToNow } from "date-fns";
import useNavigate from "@/libs/navigate";
import { useParams } from "react-router-dom";

interface Workload {
  kind: "Deployment" | "StatefulSet" | "DaemonSet";
  name: string;
  readyReplicas: number;
  totalReplicas: number;
  creationTimestamp: string;
  labels: Record<string, string>;
  ip?: string;
  ports?: string[];
}

export function NamespaceWorkloadLedger() {
  const { namespace } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("all");

  // Fetch all primary workload types
  const { resource: deployments, isLoading: isDeplLoading } = useKubernertesResources({
    nameSpace: namespace as string,
    type: "deployments",
  });
  const { resource: statefulsets, isLoading: isStsLoading } = useKubernertesResources({
    nameSpace: namespace as string,
    type: "statefulsets",
  });
  const { resource: daemonsets, isLoading: isDsLoading } = useKubernertesResources({
    nameSpace: namespace as string,
    type: "daemonsets",
  });
  const { resource: services, isLoading: isSvcLoading } = useKubernertesResources({
    nameSpace: namespace as string,
    type: "services",
  });

  const isLoading = isDeplLoading || isStsLoading || isDsLoading || isSvcLoading;

  const workloads = useMemo(() => {
    const list: Workload[] = [];

    // Process Deployments
    deployments?.forEach((item) => {
      list.push({
        kind: "Deployment",
        name: item.metadata.name,
        readyReplicas: item.status?.readyReplicas || 0,
        totalReplicas: item.spec?.replicas || 0,
        creationTimestamp: item.metadata.creationTimestamp,
        labels: item.spec?.template?.metadata?.labels || {},
      });
    });

    // Process StatefulSets
    statefulsets?.forEach((item) => {
      list.push({
        kind: "StatefulSet",
        name: item.metadata.name,
        readyReplicas: item.status?.readyReplicas || 0,
        totalReplicas: item.spec?.replicas || 0,
        creationTimestamp: item.metadata.creationTimestamp,
        labels: item.spec?.template?.metadata?.labels || {},
      });
    });

    // Process DaemonSets
    daemonsets?.forEach((item) => {
      list.push({
        kind: "DaemonSet",
        name: item.metadata.name,
        readyReplicas: item.status?.numberReady || 0,
        totalReplicas: item.status?.desiredNumberScheduled || 0,
        creationTimestamp: item.metadata.creationTimestamp,
        labels: item.spec?.template?.metadata?.labels || {},
      });
    });

    // Map Networking info from Services
    return list.map(workload => {
      const associatedSvc = services?.find(svc => {
        const selector = svc.spec?.selector;
        if (!selector) return false;
        return Object.keys(selector).every(key => workload.labels[key] === selector[key]);
      });

      if (associatedSvc) {
        return {
          ...workload,
          ip: associatedSvc.spec?.clusterIP,
          ports: associatedSvc.spec?.ports?.map((p: any) => `${p.port}/${p.protocol}`) || []
        };
      }
      return workload;
    });
  }, [deployments, statefulsets, daemonsets, services]);

  const filteredWorkloads = workloads.filter(w => {
    if (activeTab === "all") return true;
    return w.kind.toLowerCase() === activeTab.slice(0, -1); // e.g., 'deployments' -> 'deployment'
  });

  const categories = [
    { id: "all", label: "All Workloads", icon: <Layers className="h-4 w-4" /> },
    { id: "deployments", label: "Deployments", icon: <Rocket className="h-4 w-4" /> },
    { id: "statefulsets", label: "StatefulSets", icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "daemonsets", label: "DaemonSets", icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <Card className="flex flex-col border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/40 bg-muted/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Box className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Workload Ledger</CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Availability & Connectivity pulse</p>
            </div>
          </div>
          <Tabs
            variant="pill"
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={categories}
            className="w-full md:w-auto"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {filteredWorkloads.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No workloads found</p>
              </div>
            ) : (
              filteredWorkloads.map((w) => {
                const health = w.readyReplicas === w.totalReplicas ? 'healthy' : w.readyReplicas === 0 ? 'critical' : 'warning';
                const progressValue = (w.readyReplicas / (w.totalReplicas || 1)) * 100;

                return (
                  <div
                    key={`${w.kind}-${w.name}`}
                    onClick={() => navigate(`/orchestration/kubernetes/${namespace}/deployments/${w.kind.toLowerCase()}s/${w.name}`)}
                    className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-white/40 hover:bg-white/70 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* Status pulse backdrop */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                      health === 'healthy' ? "bg-emerald-500" : health === 'critical' ? "bg-destructive animate-pulse" : "bg-amber-500"
                    )} />

                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        health === 'healthy' ? "bg-emerald-500/10" : "bg-muted"
                      )}>
                        {w.kind === 'Deployment' ? <Rocket className="h-4 w-4" /> : w.kind === 'StatefulSet' ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground truncate">{w.name}</span>
                          <Badge variant="outline" className="text-[9px] font-black h-4 px-1 lowercase text-muted-foreground">{w.kind}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(w.creationTimestamp), { addSuffix: true })}
                          </span>
                          {w.ip && (
                            <span className="flex items-center gap-1 text-primary">
                              <Network className="h-2.5 w-2.5" />
                              {w.ip}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-48 shrink-0">
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground mr-4">Availability</span>
                        <span className={cn(
                          "text-[10px] font-black tracking-tight",
                          health === 'healthy' ? "text-emerald-500" : "text-amber-600"
                        )}>
                          {w.readyReplicas} / {w.totalReplicas} Replicas
                        </span>
                      </div>
                      <Progress
                        value={progressValue}
                        className="h-1.5"
                        indicatorClassName={cn(
                          health === 'healthy' ? "bg-emerald-500" : health === 'critical' ? "bg-destructive" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        )}
                      />
                    </div>

                    <div className="hidden group-hover:flex items-center justify-center p-1.5 rounded-full bg-primary/10 text-primary transition-opacity">
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

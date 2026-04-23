import React from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Box, 
  Info,
  Search,
  Filter
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";
import { formatDistanceToNow } from "date-fns";
import useNavigate from "@/libs/navigate";

interface K8sEvent {
  involvedObject: {
    kind: string;
    name: string;
    namespace: string;
    uid?: string;
  };
  reason: string;
  message: string;
  source: {
    component: string;
    host?: string;
  };
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  type: "Normal" | "Warning" | string;
}

interface NamespaceActivityProps {
  events: K8sEvent[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const ActivityItem = ({ event }: { event: K8sEvent }) => {
  const navigate = useNavigate();
  const isWarning = event.type === "Warning";
  
  const handleObjectClick = () => {
    const kind = event.involvedObject.kind.toLowerCase();
    const name = event.involvedObject.name;
    const ns = event.involvedObject.namespace;
    
    // Strategic navigation based on resource kind
    if (kind === 'pod') navigate(`/orchestration/kubernetes/${ns}/pods/${name}`);
    else if (kind === 'deployment') navigate(`/orchestration/kubernetes/${ns}/deployments/${name}`);
    else if (kind === 'service') navigate(`/orchestration/kubernetes/${ns}/services/${name}`);
  };

  return (
    <div className="group relative pl-6 pb-6 last:pb-2">
      {/* Vertical Line Connector */}
      <div className="absolute left-2.5 top-2 bottom-0 w-px bg-border/40 group-last:hidden" />
      
      {/* Status Node */}
      <div className={cn(
        "absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-background flex items-center justify-center z-10 transition-transform group-hover:scale-110",
        isWarning ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
      )}>
        {isWarning ? (
          <AlertTriangle className="h-2.5 w-2.5 text-white" />
        ) : (
          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Badge 
              variant={isWarning ? "warning" : "success"} 
              className="text-[9px] h-4.5 px-1.5 font-black uppercase tracking-wider shrink-0"
            >
              {event.reason}
            </Badge>
            <span 
              onClick={handleObjectClick}
              className="text-[11px] font-bold text-foreground hover:text-primary cursor-pointer transition-colors truncate"
            >
              {event.involvedObject.kind}: {event.involvedObject.name}
            </span>
          </div>
          <time className="text-[10px] font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(event.lastTimestamp), { addSuffix: true })}
          </time>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed break-words bg-muted/30 p-2 rounded-lg border border-border/20 group-hover:border-primary/20 transition-colors">
          {event.message}
        </p>

        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/70 px-1 pt-0.5">
          <span className="flex items-center gap-1">
            <Box className="h-2.5 w-2.5" />
            {event.source.component}
          </span>
          {event.count > 1 && (
            <span className="flex items-center gap-1 text-primary bg-primary/5 px-1.5 rounded-sm border border-primary/10">
              {event.count}x occurrences
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export function NamespaceActivity({ events, isLoading, error, className }: NamespaceActivityProps) {
  const [showOnlyWarnings, setShowOnlyWarnings] = React.useState(false);

  const sortedEvents = [...(events || [])]
    .filter(e => !showOnlyWarnings || e.type === "Warning")
    .sort((a, b) => 
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

  const totalWarnings = (events || []).filter(e => e.type === "Warning").length;

  return (
    <Card className={cn("flex flex-col border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Recent Activity</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Stream</span>
                </div>
                {totalWarnings > 0 && (
                  <Badge variant="warning" className="h-3.5 px-1 text-[8px] font-black">{totalWarnings} ISSUES</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={showOnlyWarnings ? "warning" : "outline"} 
              onClick={() => setShowOnlyWarnings(!showOnlyWarnings)}
              className={cn(
                "h-6 gap-1 text-[10px] font-bold cursor-pointer transition-all duration-300",
                showOnlyWarnings ? "shadow-md shadow-amber-500/20" : "hover:bg-muted"
              )}
            >
                <Filter className={cn("h-2.5 w-2.5", showOnlyWarnings && "animate-pulse")} />
                {showOnlyWarnings ? "Warnings Output" : "Filter"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-[10px] font-black uppercase text-muted-foreground animate-pulse">Syncing...</span>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="p-8 text-center bg-destructive/5 h-full flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
            <p className="text-xs font-bold text-destructive">Failed to fetch activity stream</p>
            <span className="text-[10px] text-muted-foreground">{error}</span>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="p-8 text-center h-full flex flex-col items-center justify-center gap-2">
            <Info className="h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-xs font-bold text-muted-foreground italic tracking-tight">No recent activity detected</p>
            <span className="text-[10px] text-muted-foreground/60">System status is quiet.</span>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6">
              {sortedEvents.map((event, idx) => (
                <ActivityItem 
                    key={`${event.involvedObject.uid || event.involvedObject.name}-${event.lastTimestamp}-${idx}`} 
                    event={event} 
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

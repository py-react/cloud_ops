import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    LayoutDashboard, 
    RefreshCw, 
    Server, 
    Database, 
    GitBranch, 
    ShieldCheck, 
    Globe,
    Activity, 
    Cpu, 
    HardDrive,
    Package,
    ArrowUpRight,
    Circle,
    AlertCircle,
    Plug,
    Shield,
    Workflow,
    Network,
    Key
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import useNavigate from '@/libs/navigate';

interface DashboardData {
    kubernetes: {
        online: boolean;
        info?: {
            platform: string;
            version: string;
            nodes_count: number;
            pods_count: number;
            running_pods: number;
            namespaces_count: number;
        };
        metrics?: {
            usage: {
                cpu: { used: string; total: string; percentage: string };
                memory: { used: string; total: string; percentage: string };
                disk: { used: string; total: string; percentage: string };
            };
        };
        error?: string;
    };
    k8s_contexts: {
        contexts: Array<{
            name: string;
            is_active: boolean;
        }>;
        current_context: string;
        total: number;
        error?: string;
    };
    docker_engines: {
        engines: Array<{
            id: number;
            name: string;
            base_url: string;
            is_active: boolean;
            is_default: boolean;
        }>;
        total: number;
        error?: string;
    };
    registries: {
        total: number;
        remote: number;
        k8s: number;
        error?: string;
    };
    cicd: {
        repositories_count: number;
        total_branches: number;
        active_repos: Array<{
            name: string;
            branch_count: number;
            polling_enabled: boolean;
        }>;
        error?: string;
    };
    bastion: {
        total_systems: number;
        active_systems: number;
        service_keys_deployed: number;
        user_pems_active: number;
        total_ssh_keys: number;
        recent_systems: Array<{ name: string; ip: string }>;
        error?: string;
    };
    last_updated: number;
    cache_hit?: boolean;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await fetch('/api/dashboard');
            const result = await response.json();
            setData(result);
            if (isManual) toast.success('Dashboard data refreshed');
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to update dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Relaxed polling: 30 seconds
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const activeEngine = useMemo(() => {
        return data?.docker_engines?.engines?.find(e => e.is_active);
    }, [data]);

    return (
        <PageLayout
            title="Infrastructure Overview"
            subtitle="Centralized control plane for Kubernetes, Docker Engines, and CI/CD pipelines."
            icon={LayoutDashboard}
            actions={
                <div className="flex items-center gap-2">
                    {data?.last_updated && (
                        <span className="text-xs text-muted-foreground mr-2 font-mono">
                            Last sync: {new Date(data.last_updated * 1000).toLocaleTimeString()}
                        </span>
                    )}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchData(true)} 
                        disabled={refreshing || loading}
                        className="h-8 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 pb-8">
                {/* --- Status Bar --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
                    <ResourceCard
                        title="Cluster Nodes"
                        count={data?.kubernetes?.info?.nodes_count || 0}
                        icon={<Server className="w-4 h-4" />}
                        color="bg-primary"
                        className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-all shadow-none"
                        isLoading={loading}
                    />
                    <ResourceCard
                        title="Active Engines"
                        count={data?.docker_engines?.total || 0}
                        icon={<Activity className="w-4 h-4" />}
                        color="bg-emerald-500"
                        className="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all shadow-none"
                        isLoading={loading}
                    />
                    <ResourceCard
                        title="Image Registries"
                        count={data?.registries?.total || 0}
                        icon={<Database className="w-4 h-4" />}
                        color="bg-purple-500"
                        className="border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all shadow-none"
                        isLoading={loading}
                    />
                    <ResourceCard
                        title="Bastion Systems"
                        count={data?.bastion?.total_systems || 0}
                        icon={<ShieldCheck className="w-4 h-4" />}
                        color="bg-indigo-500"
                        className="border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40 transition-all shadow-none"
                        isLoading={loading}
                    />
                </div>

                {/* --- Main Infrastructure Row --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Kubernetes Resource Health */}
                    <Card className="lg:col-span-8 border-border/50 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/40 bg-muted/20 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${data?.kubernetes?.online ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'} mr-1`} />
                                    <CardTitle className="text-base font-black uppercase tracking-tight">K8s Cluster Status</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono bg-background">
                                    {data?.kubernetes?.info?.version || 'N/A'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6">
                                {loading ? (
                                    <div className="space-y-6 animate-pulse">
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                        <div className="h-12 bg-muted rounded" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                    </div>
                                ) : data?.kubernetes?.error ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-destructive">
                                        <AlertCircle className="h-8 w-8 mb-2" />
                                        <p className="text-sm font-medium">K8s API Unreachable</p>
                                        <p className="text-[10px] text-muted-foreground">{data.kubernetes.error}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <MetricGauge 
                                            label="CPU Allocation" 
                                            percentage={parseInt(data?.kubernetes?.metrics?.usage?.cpu?.percentage || "0")} 
                                            used={data?.kubernetes?.metrics?.usage?.cpu?.used || "0"} 
                                            total={data?.kubernetes?.metrics?.usage?.cpu?.total || "0"} 
                                            unit="Cores"
                                            icon={<Cpu className="h-3.5 w-3.5" />}
                                            color="text-blue-600"
                                            barColor="bg-blue-600"
                                        />
                                        <MetricGauge 
                                            label="Memory Usage" 
                                            percentage={parseInt(data?.kubernetes?.metrics?.usage?.memory?.percentage || "0")} 
                                            used={data?.kubernetes?.metrics?.usage?.memory?.used || "0"} 
                                            total={data?.kubernetes?.metrics?.usage?.memory?.total || "0"} 
                                            unit=""
                                            icon={<Activity className="h-3.5 w-3.5" />}
                                            color="text-emerald-600"
                                            barColor="bg-emerald-600"
                                        />
                                        <MetricGauge 
                                            label="Disk Capacity" 
                                            percentage={parseInt(data?.kubernetes?.metrics?.usage?.disk?.percentage || "0")} 
                                            used={data?.kubernetes?.metrics?.usage?.disk?.used || "0"} 
                                            total={data?.kubernetes?.metrics?.usage?.disk?.total || "0"} 
                                            unit=""
                                            icon={<HardDrive className="h-3.5 w-3.5" />}
                                            color="text-amber-600"
                                            barColor="bg-amber-600"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-6 py-6 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/5">
                                <QuickStat label="Running Pods" value={`${data?.kubernetes?.info?.running_pods || 0} / ${data?.kubernetes?.info?.pods_count || 0}`} />
                                <QuickStat label="Namespaces" value={data?.kubernetes?.info?.namespaces_count || 0} />
                                <QuickStat label="Platform" value={data?.kubernetes?.info?.platform || 'N/A'} />
                                <QuickStat label="Status" value={data?.kubernetes?.online ? 'Healthy' : 'Error'} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CI/CD Source Control Card */}
                    <Card className="lg:col-span-4 border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-emerald-600" />
                                    Source Control
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/settings/ci_cd/source_control')}>
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription className="text-xs">Active GitHub polling repositories</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[200px] border-b border-border/40">
                                <div className="space-y-3 p-4">
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)
                                    ) : data?.cicd?.active_repos?.length ? (
                                        data.cicd.active_repos.map((repo, i) => (
                                            <div key={i} className={`flex items-center justify-between p-2 rounded-lg border transition-colors group ${repo.polling_enabled ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-muted/5 border-border/20 opacity-80'}`}>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Plug className={`h-3 w-3 shrink-0 ${repo.polling_enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-bold text-foreground truncate leading-none mb-1">{repo.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{repo.branch_count} {repo.branch_count === 1 ? 'branch' : 'branches'} tracked</span>
                                                    </div>
                                                </div>
                                                <Badge className={`h-4 text-[10px] border-none px-1.5 font-black tracking-tight ${repo.polling_enabled ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                                    {repo.polling_enabled ? 'POLLING' : 'PAUSED'}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
                                            <p className="text-xs text-muted-foreground italic tracking-tight">No active pollers</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            
                            <div className="flex items-center justify-between p-4 bg-muted/5">
                                <div className="flex flex-col">
                                    <span className="text-[11px] uppercase font-black text-muted-foreground">Total Branches</span>
                                    <span className="text-sm font-black text-foreground">{data?.cicd?.total_branches || 0}</span>
                                </div>
                                <div className="h-8 w-px bg-border/50" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[11px] uppercase font-black text-muted-foreground">SCM Status</span>
                                    <span className="text-xs font-bold text-emerald-600 uppercase">Authorized</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Row 3: Context Management --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kubernetes Contexts */}
                    <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="py-3 border-b border-border/40 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Network className="h-3.5 w-3.5 text-blue-600" />
                                Cluster Contexts
                            </CardTitle>
                            <Badge variant="outline" className="text-xs bg-blue-50/50 border-blue-200 text-blue-700">
                                {data?.k8s_contexts?.total || 0} AVAILABLE
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[180px]">
                                <div className="divide-y divide-border/40">
                                    {loading ? (
                                        Array(2).fill(0).map((_, i) => <div key={i} className="p-4 h-12 animate-pulse bg-muted/20" />)
                                    ) : data?.k8s_contexts?.contexts?.map((ctx, i) => (
                                        <div key={i} className={`p-4 flex items-center justify-between ${ctx.is_active ? 'bg-blue-500/5' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${ctx.is_active ? 'bg-blue-600 animate-pulse' : 'bg-muted-foreground/30'}`} />
                                                <span className="text-sm font-black text-foreground">{ctx.name}</span>
                                            </div>
                                            {ctx.is_active && (
                                                <Badge className="bg-blue-600 text-white border-none text-[10px] font-black px-1.5 h-4">ACTIVE</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Docker Engine Registry */}
                    <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="py-3 border-b border-border/40 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-primary" />
                                Engine Registry
                            </CardTitle>
                            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                                {data?.docker_engines?.total || 0} CONTEXTS
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[180px]">
                                <div className="divide-y divide-border/40">
                                    {loading ? (
                                        Array(2).fill(0).map((_, i) => <div key={i} className="p-4 h-12 animate-pulse bg-muted/20" />)
                                    ) : data?.docker_engines?.engines?.map((engine, i) => (
                                        <div key={i} className={`p-4 flex items-center justify-between ${engine.is_active ? 'bg-primary/5' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${engine.is_active ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-foreground flex items-center gap-2">
                                                        {engine.name}
                                                        {engine.is_default && <span className="text-xs font-normal text-muted-foreground">(Local)</span>}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{engine.base_url}</span>
                                                </div>
                                            </div>
                                            {engine.is_active && (
                                                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black px-1.5 h-4">ACTIVE</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Row 4: Inventory & Access --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Registries Summary */}
                    <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="py-3 border-b border-border/40 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-purple-600" />
                                Image Storage
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/settings/docker/registry')}>
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center justify-center space-y-1">
                                    <Globe className="h-5 w-5 text-purple-600" />
                                    <span className="text-xl font-black text-purple-700">{data?.registries?.remote || 0}</span>
                                    <span className="text-[11px] font-black uppercase text-purple-600/70">Remote</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center space-y-1">
                                    <Database className="h-5 w-5 text-blue-600" />
                                    <span className="text-xl font-black text-blue-700">{data?.registries?.k8s || 0}</span>
                                    <span className="text-[11px] font-black uppercase text-blue-600/70">K8s Native</span>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-muted/5 border-t border-border/40 flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground">Connectivity Status</span>
                                <div className="flex items-center gap-1.5">
                                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                                    <span className="text-xs font-black uppercase text-emerald-600 tracking-tight">Optimal</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bastion Systems Summary */}
                    <Card className="border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="py-3 border-b border-border/40 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-indigo-600" />
                                Bastion Access
                            </CardTitle>
                            <Badge variant="outline" className="text-xs bg-indigo-50/50 border-indigo-200 text-indigo-700">
                                {data?.bastion?.active_systems || 0} ONLINE
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 grid grid-cols-3 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Service Keys</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-foreground">{data?.bastion?.service_keys_deployed || 0}</span>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Deploy</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Identity PEMs</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-indigo-600">{data?.bastion?.user_pems_active || 0}</span>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Stored</span>
                                    </div>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Trust Index</span>
                                    <div className="flex items-baseline gap-1 justify-end">
                                        <span className="text-lg font-black text-emerald-600">{data?.bastion?.total_ssh_keys || 0}</span>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Pairs</span>
                                    </div>
                                </div>
                            </div>
                            <ScrollArea className="h-[120px] border-t border-border/40 bg-muted/5">
                                <div className="divide-y divide-border/40">
                                    {data?.bastion?.recent_systems?.map((sys, i) => (
                                        <div key={i} className="px-4 py-2 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-foreground">{sys.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{sys.ip}</span>
                                        </div>
                                    ))}
                                    {(!data?.bastion?.recent_systems || data.bastion.recent_systems.length === 0) && (
                                        <div className="p-4 text-center text-xs text-muted-foreground italic">No managed systems</div>
                                    )}
                                </div>
</ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
};

/* --- Helper Components --- */

const MetricGauge = ({ label, percentage, used, total, unit, icon, color, barColor }: any) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-muted ${color}`}>{icon}</div>
                <span className="text-sm font-black text-foreground uppercase tracking-tight">{label}</span>
            </div>
            <span className={`text-xl font-black ${color}`}>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" indicatorClassName={barColor} />
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Used: {used} {unit}</span>
            <span>Total: {total} {unit}</span>
        </div>
    </div>
);

const QuickStat = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
        <span className="text-sm font-black text-foreground">{value}</span>
    </div>
);

export default Dashboard;

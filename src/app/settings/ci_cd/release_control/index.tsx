import React, { useState, useEffect, useContext } from "react";
import {
    Rocket,
    RefreshCw,
    Activity,
    ArrowRight,
    ChevronRight,
    History,
    ShieldCheck,
    Zap,
    TrendingUp,
    Split,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import PageLayout from "@/components/PageLayout";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const ReleaseSlider = ({ row, handleWeightUpdate, updating }: any) => {
    const stableKey = row.stable_service_name || row.name;
    const strategyKey = row.strategy_service_name || `${row.name}-canary`;
    const apiStableWeight = row.weights?.[stableKey] ?? 0;
    const apiCanaryWeight = row.weights?.[strategyKey] ?? 0;

    const [localWeight, setLocalWeight] = useState(apiStableWeight);

    // Sync if API updates
    useEffect(() => {
        setLocalWeight(apiStableWeight);
    }, [apiStableWeight]);

    return (
        <div className="flex flex-col gap-2 min-w-[200px] py-2">
            <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-500 font-bold">{localWeight}% Stable</span>
                <span className="text-indigo-500 font-bold">{100 - localWeight}% {row.strategy === "blue-green" ? "Staging" : "Canary"}</span>
            </div>
            <Slider
                value={[localWeight]}
                max={100}
                step={5}
                onValueChange={(val) => setLocalWeight(val[0])}
                onValueCommit={(val) => handleWeightUpdate(row.name, row.http_route, val[0], stableKey, strategyKey)}
                className="py-2"
                disabled={updating === row.name}
            />
        </div>
    );
};

const ReleaseControlPage = () => {
    const { selectedNamespace } = useContext(NamespaceContext);
    const [activeReleases, setActiveReleases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchReleases = async () => {
        if (!selectedNamespace) return;
        setLoading(true);
        try {
            // Note: We'll use the generic fetch for the new endpoint until client is regenerated
            const response = await fetch(`/api/integration/kubernetes/release/control?namespace=${selectedNamespace}`);
            const result = await response.json();
            if (result.status === "success") {
                setActiveReleases(result.data || []);
            } else {
                toast.error(result.message || "Failed to fetch active releases");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while fetching releases");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReleases();
    }, [selectedNamespace]);

    const handleWeightUpdate = async (releaseName: string, routeName: string, stableWeight: number, stableKey: string, strategyKey: string) => {
        setUpdating(releaseName);
        try {
            const canaryWeight = 100 - stableWeight;
            const weights: Record<string, number> = {};
            weights[stableKey] = stableWeight;
            weights[strategyKey] = canaryWeight;

            const response = await fetch("/api/integration/kubernetes/release/control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "weight",
                    namespace: selectedNamespace,
                    route_name: routeName,
                    weights
                })
            });
            const result = await response.json();
            if (result.status === "success") {
                toast.success(`Traffic split updated: ${stableWeight}% / ${canaryWeight}%`);
                fetchReleases();
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleAction = async (releaseName: string, action: "promote" | "rollback") => {
        if (!window.confirm(`Are you sure you want to ${action} this release?`)) return;

        setUpdating(releaseName);
        try {
            const response = await fetch("/api/integration/kubernetes/release/control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    namespace: selectedNamespace,
                    name: releaseName
                })
            });
            const result = await response.json();
            if (result.status === "success") {
                toast.success(result.message);
                fetchReleases();
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdating(null);
        }
    };

    const columns = [
        {
            header: "Application",
            accessor: "name",
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Canary Deployment</span>
                </div>
            )
        },
        {
            header: "Strategy",
            accessor: "strategy",
            cell: (row: any) => (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 uppercase text-[10px] px-2 py-0">
                    {row.strategy}
                </Badge>
            )
        },
        {
            header: "Traffic Split (Stable / Canary)",
            accessor: "weights",
            cell: (row: any) => (
                <ReleaseSlider row={row} handleWeightUpdate={handleWeightUpdate} updating={updating} />
            )
        },
        {
            header: "Infrastructure",
            accessor: "http_route",
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <Split className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{row.http_route || "No split route found"}</span>
                </div>
            )
        },
        {
            header: "Progress",
            accessor: "status",
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <div className="animate-pulse h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Rolling Out</span>
                </div>
            )
        }
    ];

    return (
        <PageLayout
            title="Release Control"
            subtitle="Manage active Canary and Blue-Green releases with traffic weight orchestration."
            icon={Rocket}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchReleases} disabled={loading}>
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <ResourceCard
                    title="Active Canary"
                    count={activeReleases.filter(r => r.strategy === 'canary').length}
                    icon={<Activity className="h-4 w-4" />}
                    color="bg-indigo-500"
                    className="border-indigo-500/20 bg-indigo-500/5"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Active Blue-Green"
                    count={activeReleases.filter(r => r.strategy === 'blue-green').length}
                    icon={<Zap className="h-4 w-4" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/20 bg-emerald-500/5"
                    isLoading={loading}
                />
                <ResourceCard
                    title="System Health"
                    count="98%"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    color="bg-blue-500"
                    className="border-blue-500/20 bg-blue-500/5"
                    isLoading={loading}
                />
            </div>
            <div className="flex-1 min-h-0">
                <ResourceTable
                    title="Active Release Orchestrations"
                    description="Direct traffic split and promote canary deployments to production."
                    icon={<Split className="h-4 w-4" />}
                    columns={columns}
                    data={activeReleases}
                    loading={loading}
                    onPromote={(row) => handleAction(row.name, "promote")}
                    onRollback={(row) => handleAction(row.name, "rollback")}
                    showPromote={true}
                    showRollback={true}
                />
            </div>

            {activeReleases.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-12 bg-card/20 border border-dashed rounded-xl mt-4">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <History className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No active releases</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                        Deploy an application using the "Canary" or "Blue-Green" strategy to see them appear here for orchestration.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
                        Back to Deployments
                    </Button>
                </div>
            )}
        </PageLayout>
    );
};

export default ReleaseControlPage;

import React, { useState, useEffect } from 'react'
import { Activity, Rocket, CheckCircle2, AlertCircle, Loader2, ExternalLink, ActivityIcon, PlusIcon, Database, LayoutDashboard, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DefaultService } from '@/gingerJs_api_client'
import { toast } from 'sonner'
import { cn } from '@/libs/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MonitoringCardProps {
    title: string;
    description: string;
    component: "prometheus" | "grafana";
    icon: React.ReactNode;
    features: string[];
    proxyUrl: string;
}

function MonitoringCard({ title, description, component, icon, features, proxyUrl }: MonitoringCardProps) {
    const [loading, setLoading] = useState(false)
    const [installed, setInstalled] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [logs, setLogs] = useState<any[]>([])

    // Check status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response: any = await DefaultService.apiMonitoringInstallGet({ component })
                setInstalled(!!response.installed)
                setDeleting(!!response.deleting)
            } catch (error) {
                console.error(`Error checking ${component} status:`, error)
            }
        }
        checkStatus()
    }, [component])

    const handleDeploy = async () => {
        setLoading(true)
        setLogs([])
        try {
            const response: any = await DefaultService.apiMonitoringInstallPost({ component })
            if (response.success) {
                toast.success(`${title} deployment initiated!`)
                setInstalled(true)
                setDeleting(false)
                setLogs((response.results as any[]) || [])
            } else {
                toast.error(response.message || `Failed to deploy ${title}`)
            }
        } catch (error) {
            toast.error(`An error occurred during ${title} installation`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        setLogs([])
        try {
            const response: any = await DefaultService.apiMonitoringInstallDelete({ component })
            if (response.success) {
                toast.success(`${title} cleanup completed!`)
                setInstalled(false)
                setDeleting(true)
                setLogs((response.details as any[]) || [])
            } else {
                toast.error(response.message || `Failed to delete ${title}`)
            }
        } catch (error) {
            toast.error(`An error occurred during ${title} cleanup`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className={cn(
                "relative overflow-hidden border-2 transition-all duration-300 flex flex-col h-full",
                installed ? "border-green-500/20 shadow-green-500/5" :
                    deleting ? "border-amber-500/20 shadow-amber-500/5 bg-amber-500/5" :
                        "border-primary/20 shadow-primary/5 hover:border-primary/40"
            )}>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            {icon}
                        </div>
                        {installed && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Installed
                            </div>
                        )}
                        {deleting && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-semibold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Deleting...
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription className="text-base min-h-[3rem]">
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                    <div className="space-y-2">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>

                    {installed && (
                        <div className="pt-4 mt-4 border-t border-dashed">
                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                <span className="text-sm font-medium">Dashboard</span>
                                <a
                                    href={proxyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                                        Open UI <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4">
                    {deleting ? (
                        <Button
                            className="w-full h-11 text-base shadow-lg shadow-amber-500/10 transition-all bg-amber-500 hover:bg-amber-600 text-white"
                            disabled
                        >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting Component...
                        </Button>
                    ) : !installed ? (
                        <Button
                            className="w-full h-11 text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            onClick={handleDeploy}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Rocket className="mr-2 h-4 w-4" />
                            )}
                            {loading ? `Deploying...` : `Deploy ${title}`}
                        </Button>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full h-11 shadow-lg shadow-red-500/10 transition-all active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    {loading ? `Deleting...` : `Delete ${title}`}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove the <strong>{title}</strong> resources from the cluster.
                                        Any transient data associated with this component will be lost.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Continue Deletion
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>

            {logs.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4" />
                            {title} Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                        <div className="grid gap-1">
                            {logs.map((res, i) => (
                                <div key={i} className="flex items-center justify-between py-1 italic text-xs">
                                    <span className="font-mono text-muted-foreground">{res.kind}/{res.name}</span>
                                    {res.status === 'success' || res.status === 'deleted' ? (
                                        <span className="text-green-600 font-semibold">{res.status}</span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">{res.error || 'failed'}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function Monitoring() {
    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="flex flex-col gap-10">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3">Production Essentials</h1>
                    <p className="text-xl text-muted-foreground">Premium infrastructure components for professional workloads.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 items-start">
                    <MonitoringCard
                        title="Prometheus"
                        description="Professional-grade time series database and monitoring server."
                        component="prometheus"
                        icon={<Database className="w-8 h-8 text-primary" />}
                        features={[
                            "Prometheus Server (v2.45.0)",
                            "Kubernetes API Scraping",
                            "Node Exporter Ready",
                            "Alerting Integration"
                        ]}
                        proxyUrl="/cluster/proxy/prometheus-service/monitoring/"
                    />

                    <MonitoringCard
                        title="Grafana"
                        description="Beautiful anomaly detection and performance visualization dashboards."
                        component="grafana"
                        icon={<LayoutDashboard className="w-8 h-8 text-primary" />}
                        features={[
                            "Grafana Dashboard (v10.0.0)",
                            "Anonymous Admin Access",
                            "Pre-built Dashboards",
                            "Plugin Support included"
                        ]}
                        proxyUrl="/cluster/proxy/grafana/monitoring/"
                    />
                </div>

                <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-10 text-center opacity-70">
                    <div className="p-4 bg-gray-100 rounded-full mb-5">
                        <PlusIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <CardTitle className="text-xl text-gray-500">More Tools Coming Soon</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto mt-2">
                        We're currently building 1-click deployments for ELK Stack, Jaeger Tracing, and database management tools.
                    </CardDescription>
                </Card>
            </div>
        </div>
    )
}

export default Monitoring

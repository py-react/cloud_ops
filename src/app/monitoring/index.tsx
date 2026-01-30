import React, { useState, useEffect } from 'react'
import { Activity, Rocket, CheckCircle2, AlertCircle, Loader2, ExternalLink, ActivityIcon, PlusIcon, Database, LayoutDashboard, Trash2, LineChart } from 'lucide-react'
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
import PageLayout from '@/components/PageLayout'
import AddonCard from '@/components/AddonCard'

interface MonitoringCardProps {
    title: string;
    description: string;
    component: "prometheus" | "grafana" | "metrics-server";
    icon: React.ReactNode;
    features: string[];
    proxyUrl?: string;
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

    const footerActions = (
        <div className="flex flex-col gap-2 w-full">
            {deleting ? (
                <Button
                    className="w-full h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                    disabled
                >
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Deleting...
                </Button>
            ) : !installed ? (
                <Button
                    className="w-full h-9 text-xs shadow-sm shadow-primary/10 transition-all active:scale-[0.98]"
                    onClick={handleDeploy}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                        <Rocket className="mr-2 h-3 w-3" />
                    )}
                    {loading ? `Deploying...` : `Deploy`}
                </Button>
            ) : (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full h-9 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-3 w-3" />
                            )}
                            Remove
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove {title}?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                                This will remove all <strong>{title}</strong> resources from the cluster.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="h-9 text-xs bg-destructive text-white hover:bg-destructive/90"
                            >
                                Remove Now
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )

    const actions = installed && proxyUrl ? (
        <div className="pt-3 mt-3 border-t border-dashed border-primary/10">
            <a
                href={proxyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
            >
                <Button variant="secondary" size="sm" className="w-full h-8 text-xs gap-1.5 bg-secondary/50 hover:bg-secondary">
                    Open Dashboard <ExternalLink className="w-3 h-3" />
                </Button>
            </a>
        </div>
    ) : null

    return (
        <div className="space-y-4 h-full">
            <AddonCard
                title={title}
                description={description}
                icon={React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 text-primary" })}
                status={installed ? 'installed' : deleting ? 'deleting' : 'available'}
                features={features}
                actions={actions}
                footerActions={footerActions}
            />

            {logs.length > 0 && (
                <Card className="border-primary/10 bg-primary/5 mt-2">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-[10px] uppercase tracking-wider flex items-center gap-2 text-muted-foreground font-bold">
                            <ActivityIcon className="w-3 h-3" />
                            Recent activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-1 px-3">
                        <div className="grid gap-0.5">
                            {logs.slice(0, 3).map((res, i) => (
                                <div key={i} className="flex items-center justify-between py-1 text-[10px]">
                                    <span className="font-mono text-muted-foreground truncate max-w-[120px]">{res.name}</span>
                                    {res.status === 'success' || res.status === 'deleted' ? (
                                        <span className="text-green-600 uppercase font-bold">{res.status}</span>
                                    ) : (
                                        <span className="text-red-600 uppercase font-bold">Error</span>
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
        <PageLayout
            title="Monitoring Essentials"
            subtitle="Lightweight, 1-click infrastructure addons for your cluster."
            icon={LineChart}
        >
            <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    <MonitoringCard
                        title="Prometheus"
                        description="Professional-grade time series database and monitoring server."
                        component="prometheus"
                        icon={<Database />}
                        features={[
                            "Prometheus Server (v2.45.0)",
                            "Kubernetes API Scraping",
                            "Node Exporter Ready"
                        ]}
                        proxyUrl="/cluster/proxy/prometheus-service/monitoring/"
                    />

                    <MonitoringCard
                        title="Grafana"
                        description="Beautiful anomaly detection and performance visualization dashboards."
                        component="grafana"
                        icon={<LayoutDashboard />}
                        features={[
                            "Grafana Dashboard (v10.0.0)",
                            "Anonymous Admin Access",
                            "Pre-built Dashboards"
                        ]}
                        proxyUrl="/cluster/proxy/grafana/monitoring/"
                    />

                    <MonitoringCard
                        title="Metrics Server"
                        description="Cluster-wide aggregator of resource usage data."
                        component="metrics-server"
                        icon={<Activity />}
                        features={[
                            "Resource Metrics API",
                            "Enables Pod Autoscaler",
                            "kubectl top support"
                        ]}
                    />

                    <div className="h-full">
                        <Card className="border border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-6 text-center hover:bg-primary/10 transition-all cursor-pointer group h-full min-h-[280px]">
                            <div className="p-3 bg-white/50 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <PlusIcon className="w-6 h-6 text-primary/40" />
                            </div>
                            <CardTitle className="text-sm font-bold text-primary/60">More coming</CardTitle>
                            <CardDescription className="text-[10px] mt-1">
                                ELK, Jaeger, and DB tools in development.
                            </CardDescription>
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

export default Monitoring

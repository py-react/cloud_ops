import React, { useState, useEffect } from 'react'
import { Activity, ActivityIcon, AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Database, ExternalLink, Gauge, Layout, LayoutDashboard, LineChart, Loader2, PlusIcon, RefreshCw, Rocket, Settings, Settings2Icon, Shield, Trash2, Zap } from 'lucide-react'
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
import { FormWizard } from '@/components/wizard/form-wizard'
import { MonitoringConfigStep } from './components/MonitoringConfigStep'
import { LiveAlertLogsStep } from './components/LiveAlertLogsStep'
import { z } from 'zod'

interface MonitoringCardProps {
    title: string;
    description: string;
    component: "prometheus" | "grafana" | "metrics-server" | "alertmanager";
    icon: React.ReactNode;
    features: string[];
    proxyUrl?: string;
}

function MonitoringCard({ title, description, component, icon, features, proxyUrl }: MonitoringCardProps) {
    const [loading, setLoading] = useState(false)
    const [installed, setInstalled] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [logs, setLogs] = useState<any[]>([])
    const [configYaml, setConfigYaml] = useState('')
    const [isOpinionated, setIsOpinionated] = useState(true)
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [configLoading, setConfigLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState('config')
    const [isTestLoading, setIsTestLoading] = useState(false)

    // Check status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response: any = await DefaultService.apiMonitoringInstallGet({ component })
                const isInstalled = !!response.installed
                setInstalled(isInstalled)
                setDeleting(!!response.deleting)

                // Proactively fetch config for alertmanager to enable the Test button
                if (component === 'alertmanager' && isInstalled) {
                    fetchConfig()
                }
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

                // Fetch config after deployment to enable Test button if applicable
                if (component === 'alertmanager') {
                    setTimeout(fetchConfig, 2000) // Small delay for ConfigMap to be ready
                }
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

    const fetchConfig = async () => {
        setConfigLoading(true)
        console.log(`[MonitoringCard] Fetching config for: ${component}`)
        try {
            // Explicitly pass component in query string for maximum reliability
            const response = await fetch(`/api/monitoring/config?component=${component}`).then(res => res.json())

            console.log(`[MonitoringCard] Received config for ${component}:`, response)
            if (response.success) {
                setConfigYaml(response.config || '')
                setIsOpinionated(response.isOpinionated ?? false)
            } else {
                toast.error(response.message || "Failed to fetch configuration")
            }
        } catch (error) {
            toast.error("An error occurred while fetching configuration")
            console.error(error)
        } finally {
            setConfigLoading(false)
        }
    }

    const handleSaveConfig = async (data: { config: string }) => {
        setConfigLoading(true)
        try {
            // @ts-ignore
            const response: any = await DefaultService.apiMonitoringConfigPost({ requestBody: { config: data.config, component } })
            if (response.success) {
                toast.success("Configuration updated successfully!")
                setIsConfigOpen(false)
                // Refresh local state to update UI/Test button visibility
                fetchConfig()
            } else {
                toast.error(response.message || "Failed to update configuration")
                throw new Error(response.message) // Rethrow for FormWizard
            }
        } catch (error) {
            toast.error("An error occurred while updating configuration")
            console.error(error)
            throw error // Rethrow for FormWizard
        } finally {
            setConfigLoading(false)
        }
    }

    const handleTestAlert = async () => {
        setIsTestLoading(true)
        try {
            // @ts-ignore - Endpoint may be new in client
            const response: any = await DefaultService.apiMonitoringTestAlertsPost()
            if (response.success) {
                toast.success("Test sequence initiated! Opening Live Stream...")
                // Auto-open the wizard to the logs step
                setCurrentStep('logs')
                setIsConfigOpen(true)
            } else {
                toast.error(response.message || "Failed to trigger test alerts")
            }
        } catch (error) {
            toast.error("An error occurred while testing alerts")
            console.error(error)
        } finally {
            setIsTestLoading(false)
        }
    }

    // Opinionated config check now comes from backend
    const isOpinionatedConfig = isOpinionated;

    const configMeta: Record<string, { label: string, description: string, longDescription: string, fileName: string, configLabel: string, icon: any }> = {
        alertmanager: {
            label: 'Alerting Configuration',
            description: 'Edit your alerting rules and receivers here.',
            longDescription: 'Direct access to the Alertmanager configuration. You can configure how alerts are grouped, routed, and where notifications are sent.',
            fileName: 'alertmanager.yml',
            configLabel: 'Make sure to follow the Alertmanager specification for routes and receivers.',
            icon: AlertCircle
        },
        prometheus: {
            label: 'Prometheus Configuration',
            description: 'Edit your scraping and global monitoring rules.',
            longDescription: 'Direct access to the Prometheus configuration. You can configure scrape targets, intervals, and global evaluation rules.',
            fileName: 'prometheus.yml',
            configLabel: 'Make sure to follow the Prometheus specification for jobs and scrape configs.',
            icon: Database
        },
        grafana: {
            label: 'Grafana Data Sources',
            description: 'Manage your observability data sources.',
            longDescription: 'Configure how Grafana connects to Prometheus and other backends.',
            fileName: 'datasources.yaml',
            configLabel: 'Ensure the datasource URLs match your cluster internal service names.',
            icon: LayoutDashboard
        }
    }

    const currentMeta = configMeta[component] || configMeta.alertmanager

    const wizardSteps = [
        {
            id: 'config',
            label: currentMeta.label,
            description: currentMeta.description,
            longDescription: currentMeta.longDescription,
            icon: Settings2Icon,
            component: (props: any) => (
                <MonitoringConfigStep
                    {...props}
                    fileName={currentMeta.fileName}
                    configLabel={currentMeta.configLabel}
                />
            ),
        },
        ...(component === 'alertmanager' && isOpinionatedConfig ? [{
            id: 'logs',
            label: 'Live Alert Stream',
            description: 'Watch alerts hit your webhooks in real-time.',
            longDescription: 'This feed shows exactly what Alertmanager is sending to our categorization webhooks. Use the "Test Alert" button to see it in action.',
            icon: Activity,
            component: LiveAlertLogsStep,
        }] : [])
    ]

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
                <div className="flex flex-col gap-2">
                    {['alertmanager', 'prometheus', 'grafana'].includes(component) && (
                        <>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-9 text-xs rounded-xl border-border/50"
                                    onClick={async () => {
                                        await fetchConfig()
                                        setIsConfigOpen(true)
                                    }}
                                >
                                    <Settings2Icon className="mr-2 h-3.5 w-3.5" />
                                    Configure
                                </Button>
                                {component === 'alertmanager' && isOpinionatedConfig && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-xs rounded-xl border-blue-200 bg-blue-50/30 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                        onClick={handleTestAlert}
                                        disabled={isTestLoading}
                                    >
                                        {isTestLoading ? (
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Zap className="mr-2 h-3.5 w-3.5" />
                                        )}
                                        Test Alert
                                    </Button>
                                )}
                            </div>
                            <FormWizard
                                isWizardOpen={isConfigOpen}
                                setIsWizardOpen={setIsConfigOpen}
                                steps={wizardSteps}
                                initialValues={{ config: configYaml }}
                                schema={z.object({ config: z.string().min(1, "Config cannot be empty") })}
                                onSubmit={handleSaveConfig}
                                currentStep={currentStep}
                                setCurrentStep={setCurrentStep}
                                heading={{
                                    primary: currentMeta.label,
                                    secondary: currentMeta.description,
                                    icon: currentMeta.icon || Settings
                                }}
                                name={`${component}-config`}
                                submitLabel="Save Configuration"
                                submitIcon={CheckCircle2}
                            />
                        </>
                    )}

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
                                Uninstall
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
                </div>
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
    const [prometheusInstalled, setPrometheusInstalled] = useState(false)

    useEffect(() => {
        const checkPrometheus = async () => {
            try {
                const response: any = await DefaultService.apiMonitoringInstallGet({ component: 'prometheus' })
                setPrometheusInstalled(!!response.installed)
            } catch (error) {
                console.error("Error checking Prometheus status:", error)
            }
        }
        checkPrometheus()
        // Poll every 5 seconds to keep visibility in sync
        const interval = setInterval(checkPrometheus, 5000)
        return () => clearInterval(interval)
    }, [])

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

                    {prometheusInstalled && (
                        <MonitoringCard
                            title="Alerting"
                            description="Professional-grade alerting with Alertmanager and opinionated rules."
                            component="alertmanager"
                            icon={<AlertCircle />}
                            features={[
                                "Alertmanager (v0.25.0)",
                                "Node & Pod Health Rules",
                                "Webhook Ready"
                            ]}
                            proxyUrl="/cluster/proxy/alertmanager-service/monitoring/"
                        />
                    )}

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

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Rocket, Settings, Settings2Icon, Trash2, FileSearch, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import AddonCard from '@/components/AddonCard'
import { FormWizard } from '@/components/wizard/form-wizard'
import { z } from 'zod'
import { useAddonLifecycle } from '../hooks/useAddonLifecycle'
import { useAddonConfig } from '../hooks/useAddonConfig'
import { FileEditorStep } from '../common/FileEditorStep'
import { Database, LayoutDashboard, Activity } from 'lucide-react'

interface MonitoringAddonProps {
    title: string;
    description: string;
    component: "prometheus" | "grafana" | "metrics-server" | "node-exporter" | "loki" | "promtail" | "otel-collector";
    icon: React.ReactNode;
    features: string[];
    proxyUrl?: string;
    onInstallChange?: (installed: boolean) => void;
}

export function MonitoringAddon({ title, description, component, icon, features, proxyUrl, onInstallChange }: MonitoringAddonProps) {
    const { installed, loading, deleting, deploy, remove, checkStatus } = useAddonLifecycle({ component, title, onInstallChange })
    const { configs, fetchConfig, saveConfig, configLoading } = useAddonConfig({ component })

    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState('config')

    const configMeta: Record<string, { label: string, description: string, longDescription: string, fileName: string, configLabel: string, icon: any }> = {
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
        },
        'metrics-server': {
            label: 'Metrics Server Config',
            description: 'Configure resource metrics aggregation.',
            longDescription: 'Adjust the CLI arguments for the Metrics Server. This allows you to tune resolution, port, and security settings.',
            fileName: 'config.yml',
            configLabel: 'Invalid flags may prevent the Metrics Server from starting.',
            icon: Activity
        },
        'node-exporter': {
            label: 'Node Exporter Config',
            description: 'Configure hardware and OS metric collection.',
            longDescription: 'Adjust the CLI arguments for the Node Exporter DaemonSet. You can enable/disable specific collectors and paths.',
            fileName: 'config.yml',
            configLabel: 'Consult the Node Exporter documentation for available collector flags.',
            icon: Database
        },
        loki: {
            label: 'Loki Configuration',
            description: 'Log aggregation system configuration.',
            longDescription: 'Configure retention periods, storage backends, and limits in loki.yaml.',
            fileName: 'loki.yaml',
            configLabel: 'Ensure storage and schema configs match your persistence layer.',
            icon: Database
        },
        promtail: {
            label: 'Promtail Configuration',
            description: 'Log shipping agent configuration.',
            longDescription: 'Configure scrape configs and pipeline stages in promtail.yaml to parsing logs before sending to Loki.',
            fileName: 'promtail.yaml',
            configLabel: 'Define static labels and relabel configs here.',
            icon: FileSearch
        },
        'otel-collector': {
            label: 'OTel Collector Config',
            description: 'Configure the OpenTelemetry data pipeline.',
            longDescription: 'Configure receivers, processors, and exporters. This collector is configured to send logs to Loki.',
            fileName: 'otel-collector.yaml',
            configLabel: 'Valid YAML is required for the collector to start.',
            icon: Activity
        }
    }

    const currentMeta = configMeta[component || 'prometheus'] || configMeta.prometheus

    const wizardSteps = [
        {
            id: 'config',
            label: currentMeta.label,
            description: currentMeta.description,
            longDescription: currentMeta.longDescription,
            icon: currentMeta.icon || Settings2Icon,
            submitOnNext: component === 'prometheus',
            component: (props: any) => (
                <FileEditorStep
                    {...props}
                    fileName={currentMeta.fileName}
                    label={currentMeta.configLabel}
                    name="config"
                />
            ),
        }
    ]

    const handleSave = async (data: any) => {
        const success = await saveConfig(data, currentStep)
        if (success) {
            setIsConfigOpen(false)
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
                    onClick={deploy}
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
                    </div>

                    <FormWizard
                        isWizardOpen={isConfigOpen}
                        setIsWizardOpen={setIsConfigOpen}
                        steps={wizardSteps}
                        initialValues={{
                            config: configs[component] || '',
                        }}
                        schema={z.object({
                            config: z.string().min(1, "Config cannot be empty"),
                        })}
                        onSubmit={handleSave}
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
                                    onClick={remove}
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

    useEffect(() => {
        if (installed) { fetchConfig() } else {
            checkStatus()
        }
    }, [installed])

    return (
        <div className="space-y-4 h-full">
            <AddonCard
                title={title}
                description={description}
                icon={React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 text-primary" })}
                status={installed ? 'installed' : deleting ? 'deleting' : 'available'}
                features={features}
                footerActions={footerActions}
                dashboardUrl={installed && proxyUrl ? proxyUrl : undefined}
            />
        </div>
    )
}

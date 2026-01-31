import React, { useState, useEffect } from 'react'
import { Activity, CheckCircle2, Loader2, Rocket, Settings, Settings2Icon, Trash2, Zap, AlertCircle } from 'lucide-react'
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
import { useAlertTesting } from '../hooks/useAlertTesting'
import { FileEditorStep } from '../common/FileEditorStep'
import { LiveAlertLogsStep } from './LiveAlertLogsStep'

interface AlertingAddonProps {
    title: string;
    description: string;
    component: "alertmanager";
    icon: React.ReactNode;
    features: string[];
    proxyUrl?: string;
}

export function AlertingAddon({ title, description, component, icon, features, proxyUrl }: AlertingAddonProps) {
    const { installed, loading, deleting, deploy, remove, checkStatus } = useAddonLifecycle({ component, title })
    const { configs, fetchConfig, saveConfig, isOpinionated } = useAddonConfig({ component })
    const { isTestLoading, testAlert } = useAlertTesting()

    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState('config')

    useEffect(() => {
        if (installed) { fetchConfig() } else {
            checkStatus()
        }
    }, [installed])

    const configMeta = {
        label: 'Alerting Configuration',
        description: 'Edit your alerting rules and receivers here.',
        longDescription: 'Direct access to the Alertmanager configuration. You can configure how alerts are grouped, routed, and where notifications are sent.',
        fileName: 'alertmanager.yml',
        configLabel: 'Make sure to follow the Alertmanager specification for routes and receivers.',
        icon: AlertCircle
    }

    const wizardSteps = [
        {
            id: 'config',
            label: configMeta.label,
            description: configMeta.description,
            longDescription: configMeta.longDescription,
            icon: configMeta.icon,
            component: (props: any) => (
                <FileEditorStep
                    {...props}
                    fileName={configMeta.fileName}
                    label={configMeta.configLabel}
                    name="config"
                />
            ),
        },
        ...(isOpinionated ? [{
            id: 'logs',
            label: 'Live Alert Stream',
            description: 'Watch alerts hit your webhooks in real-time.',
            longDescription: 'This feed shows exactly what Alertmanager is sending to our categorization webhooks. Use the "Test Alert" button to see it in action.',
            icon: Activity,
            component: LiveAlertLogsStep,
        }] : [])
    ]

    const handleSave = async (data: any) => {
        const success = await saveConfig(data, currentStep)
        if (success && currentStep === 'logs') {
            setIsConfigOpen(false)
        }
    }

    const handleTestAlert = () => {
        testAlert(() => {
            setCurrentStep('logs')
            setIsConfigOpen(true)
        })
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
                        {isOpinionated && (
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
                            primary: configMeta.label,
                            secondary: configMeta.description,
                            icon: configMeta.icon
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

    return (
        <div className="space-y-4 h-full">
            <AddonCard
                title={title}
                description={description}
                icon={React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 text-primary" })}
                status={installed ? 'installed' : deleting ? 'deleting' : 'available'}
                features={features}
                footerActions={footerActions}
                footerActions={footerActions}
                dashboardUrl={installed && proxyUrl ? proxyUrl : undefined}
            />
        </div>
    )
}

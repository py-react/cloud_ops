import React, { useState } from 'react'
import { CheckCircle2, Loader2, Rocket, Settings2Icon, Trash2, Box, FileCode2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { FileEditorStep } from './common/FileEditorStep'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Settings } from 'lucide-react'

export interface DynamicAddon {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
    icon_name: string;
    helm_repo_url: string;
    helm_repo_name: string;
    helm_chart_name: string;
    helm_version?: string;
    namespace: string;
    default_values?: string;
    proxy_url?: string;
    features?: string; // JSON string array
    is_system?: boolean;
    service_port?: number;
    revision?: string | number;
}

interface DynamicAddonCardProps {
    addon: DynamicAddon;
    onStatusChange: () => void;
    onSettingsToggle?: (isOpen: boolean) => void;
}

const editAddonSchema = z.object({ 
    display_name: z.string().min(1, "Display Name is required"),
    proxy_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    service_port: z.preprocess((val) => Number(val), z.number().int().positive().default(80)),
    config: z.string().optional() 
})

export function DynamicAddonCard({ addon, onStatusChange, onSettingsToggle }: DynamicAddonCardProps) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [isEditValuesOpen, setIsEditValuesOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState('settings')

    const callInstall = async (overrides?: string) => {
        setLoading(true)
        try {
            const response = await fetch('/api/addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'install',
                    id: addon.id,
                    overrides: overrides ?? addon.default_values ?? null
                })
            })
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to install');
            }
            toast.success(`${addon.display_name} redeployed successfully!`);
            onStatusChange()
        } catch (error: any) {
            toast.error(`Deployment failed: ${error.message}`);
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeploy = () => callInstall()

    const handleRedeployWithValues = async (data: z.infer<typeof editAddonSchema>) => {
        setIsEditValuesOpen(false)
        setLoading(true)
        try {
            // 1. Update Metadata
            const updateRes = await fetch('/api/addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: addon.id,
                    plugin: {
                        display_name: data.display_name,
                        proxy_url: data.proxy_url || null,
                        service_port: data.service_port
                    }
                })
            })
            if (!updateRes.ok) throw new Error('Failed to update metadata')

            // 2. Install/Redeploy Helm with overrides
            await callInstall(data.config)
            
        } catch (error: any) {
            toast.error(`Update failed: ${error.message}`)
            setLoading(false)
        }
    }

    const handleUninstall = async () => {
        setDeleting(true)
        try {
            const response = await fetch('/api/addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'uninstall', id: addon.id })
            })
            if (!response.ok) throw new Error('Failed to uninstall')
            toast.warning(`${addon.display_name} uninstalled.`);
            onStatusChange()
        } catch (error: any) {
            toast.error(`Uninstallation failed: ${error.message}`);
            console.error(error)
        } finally {
            setDeleting(false)
        }
    }

    const handleDeletePlugin = async () => {
        setDeleting(true)
        try {
            const response = await fetch('/api/addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: addon.id })
            })
            if (!response.ok) throw new Error('Failed to delete')
            toast.success(`${addon.display_name} removed from registry.`);
            onStatusChange()
        } catch (error: any) {
            toast.error(`Deletion failed: ${error.message}`);
            console.error(error)
            setDeleting(false)
        }
    }

    const editValuesWizard = (
        <FormWizard
            isWizardOpen={isEditValuesOpen}
            setIsWizardOpen={(open) => {
                setIsEditValuesOpen(open)
                onSettingsToggle?.(open)
                if (!open) setCurrentStep('settings')
            }}
            steps={[
                {
                    id: 'settings',
                    label: 'Basic Settings',
                    description: 'Name and dashboard link',
                    longDescription: 'Update the display name and the external dashboard link for this addon.',
                    icon: Settings,
                    component: ({ control }: any) => (
                        <div className="space-y-4">
                            <FormField
                                control={control}
                                name="display_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Prometheus Monitoring" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="proxy_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>External Dashboard URL <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://grafana.example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="service_port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Port</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="80" {...field} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            The internal port where the service is listening.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )
                },
                {
                    id: 'config',
                    label: 'Helm Values',
                    description: 'Override helm values.yaml',
                    longDescription: `Customize the Helm values for ${addon.display_name}. These will be applied on the next deployment.`,
                    icon: FileCode2,
                    component: (props: any) => (
                        <FileEditorStep
                            {...props}
                            fileName="values.yaml"
                            label="Helm values override — changes will be applied immediately on save."
                            name="config"
                        />
                    )
                }
            ]}
            initialValues={{ 
                display_name: addon.display_name,
                proxy_url: addon.proxy_url || '',
                service_port: addon.service_port || 80,
                config: addon.default_values || '' 
            }}
            schema={editAddonSchema}
            onSubmit={handleRedeployWithValues}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            heading={{
                primary: `Edit ${addon.display_name} Values`,
                secondary: 'Modify and redeploy with updated helm values',
                icon: FileCode2
            }}
            name={`${addon.id}-edit-values`}
            submitLabel="Save & Redeploy"
            submitIcon={CheckCircle2}
        />
    )

    const footerActions = (
        <div className="flex flex-col gap-2 w-full">
            {deleting ? (
                <Button className="w-full h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white" disabled>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Uninstalling...
                </Button>
            ) : !addon.is_installed ? (
                <div className="flex gap-2 w-full">
                    <Button
                        className="flex-1 h-9 text-xs shadow-sm shadow-primary/10 transition-all active:scale-[0.98]"
                        onClick={handleDeploy}
                        disabled={loading || deleting}
                    >
                        {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Rocket className="mr-2 h-3 w-3" />}
                        {loading ? 'Deploying...' : 'Deploy'}
                    </Button>

                    {!addon.is_system && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                disabled={loading || deleting}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete from Registry?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                    This will permanently remove <strong>{addon.display_name}</strong> from your custom addons list. 
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeletePlugin}
                                    className="h-9 text-xs bg-destructive text-white hover:bg-destructive/90"
                                >
                                    Delete Addon
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-9 text-xs rounded-xl border-border/50"
                        onClick={() => setIsEditValuesOpen(true)}
                        disabled={loading}
                    >
                        {loading
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Redeploying...</>
                            : <><Settings2Icon className="mr-2 h-3.5 w-3.5" />Edit & Redeploy</>
                        }
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-9 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                disabled={loading}
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Uninstall
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove {addon.display_name}?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                    This will uninstall the helm release <strong>{addon.name}</strong> from the cluster.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleUninstall}
                                    className="h-9 text-xs bg-destructive text-white hover:bg-destructive/90"
                                >
                                    Remove Now
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {/* Edit values wizard — rendered here but only opens on button click */}
            {editValuesWizard}
        </div>
    )

    let parsedFeatures: string[] = []
    try {
        if (addon.features) parsedFeatures = JSON.parse(addon.features)
    } catch {}

    return (
        <div className="space-y-4 h-full">
            <AddonCard
                title={addon.display_name}
                description={addon.description}
                icon={<Box className="w-5 h-5 text-primary" />}
                status={addon.is_installed ? 'installed' : deleting ? 'deleting' : 'available'}
                statusText={addon.is_installed && addon.revision ? `Installed (Rev #${addon.revision})` : undefined}
                features={parsedFeatures}
                footerActions={footerActions}
                dashboardUrl={addon.is_installed && addon.proxy_url ? addon.proxy_url : undefined}
            />
        </div>
    )
}

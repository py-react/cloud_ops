import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Shield, Globe, Lock, RefreshCw, Cpu, Database, Network, Server, Activity, HardDrive, Info, Plus, Trash2, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable"
import { DefaultService } from "@/gingerJs_api_client"
import FormWizard from "@/components/wizard/form-wizard"
import * as z from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileCode, Upload, X, AlertTriangle } from 'lucide-react'
import PageLayout from '@/components/PageLayout'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const dockerConfigSchema = z.object({
    name: z.string().min(1, "Name is required"),
    base_url: z.string().min(1, "Base URL is required"),
    client_cert: z.string().optional(),
    client_key: z.string().optional(),
    ca_cert: z.string().optional(),
    verify: z.boolean().default(true),
    status: z.string().default("active"),
})

const CertificateUploadField = ({
    label,
    value,
    onChange,
    description
}: {
    label: string,
    value?: string,
    onChange: (val: string) => void,
    description?: string
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            onChange(content)
        }
        reader.readAsText(file)
    }

    return (
        <FormItem className="flex flex-col space-y-2">
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {label}
                {value && (
                    <Badge variant="success" className="h-4 px-1 text-[8px] uppercase">Uploaded</Badge>
                )}
            </FormLabel>
            <FormControl>
                <div className="relative group">
                    {value ? (
                        <div className="flex items-center justify-between p-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono">
                            <div className="flex items-center gap-2 truncate text-emerald-700">
                                <FileCode className="h-3.5 w-3.5" />
                                <span className="truncate">PEM Certificate Loaded</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-emerald-600 hover:text-red-500 hover:bg-red-50"
                                onClick={() => onChange("")}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                type="file"
                                accept=".pem,.crt,.key,.cert"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex items-center gap-2 p-2 rounded-md border border-dashed border-input bg-background group-hover:border-primary/50 transition-colors">
                                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground italic">Click to upload .pem file</span>
                            </div>
                        </div>
                    )}
                </div>
            </FormControl>
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
            <FormMessage />
        </FormItem>
    )
}

const DockerConfigForm = ({ control }: { control: any }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Config Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Remote Hive" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="base_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base URL</FormLabel>
                            <FormControl>
                                <Input placeholder="tcp://host:port" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">TLS Certificates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={control}
                        name="client_cert"
                        render={({ field }) => (
                            <CertificateUploadField
                                label="Client Certificate"
                                value={field.value}
                                onChange={field.onChange}
                                description="Client side PEM certificate"
                            />
                        )}
                    />
                    <FormField
                        control={control}
                        name="client_key"
                        render={({ field }) => (
                            <CertificateUploadField
                                label="Client Key"
                                value={field.value}
                                onChange={field.onChange}
                                description="Client side private key"
                            />
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="ca_cert"
                    render={({ field }) => (
                        <CertificateUploadField
                            label="CA Certificate"
                            value={field.value}
                            onChange={field.onChange}
                            description="Server side CA certificate"
                        />
                    )}
                />
            </div>

            <FormField
                control={control}
                name="verify"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground">Verify TLS</FormLabel>
                            <p className="text-[10px] text-muted-foreground italic tracking-tight">Enable strict certificate validation</p>
                        </div>
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    )
}

const DockerConfig = ({ engineInfo }: { engineInfo: any }) => {
    const [configs, setConfigs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [editConfig, setEditConfig] = useState<any>(null)
    const [currentStep, setCurrentStep] = useState('setup')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [configToDelete, setConfigToDelete] = useState<any>(null)

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const data = await (DefaultService as any).apiSettingsDockerConfigGet()
            const processedData = (data || []).map((c: any) => ({
                ...c,
                showEdit: c.id !== 0,
                showDelete: c.id !== 0
            }))
            setConfigs(processedData)
        } catch (error) {
            toast.error("Failed to fetch Docker configurations")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfigs()
    }, [])

    const handleDelete = async (row: any) => {
        setConfigToDelete(row)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!configToDelete) return
        try {
            await (DefaultService as any).apiSettingsDockerConfigDelete({ id: configToDelete.id })
            toast.success("Deleted configuration")
            fetchConfigs()
        } catch (error) {
            toast.error("Failed to delete configuration")
        } finally {
            setDeleteDialogOpen(false)
            setConfigToDelete(null)
        }
    }
    
    const handleActivate = async (row: any) => {
        try {
            // ID 0 represents the Local Engine (deactivates all remote ones)
            const targetId = row.id === 'default' ? 0 : row.id;
            await (DefaultService as any).apiSettingsDockerConfigPatch({ 
                id: targetId, 
                requestBody: { is_active: true } 
            })
            toast.success(`Switched to ${row.name}`)
            fetchConfigs()
            // Optional: Refresh the page or trigger a global state update if needed
            // For now, fetchConfigs updates the local view
        } catch (error) {
            toast.error("Failed to switch context")
        }
    }

    const handleEdit = (row: any) => {
        setEditConfig(row)
        setIsWizardOpen(true)
    }

    const steps = [
        {
            id: 'setup',
            label: 'Configuration',
            description: 'Docker Engine Setup',
            longDescription: 'Configure the connection details and TLS certificates for the Docker engine.',
            component: (props: any) => <DockerConfigForm {...props} />,
        }
    ]

    return (
        <PageLayout
            title="Docker Configuration"
            subtitle={
                <div className="flex items-center gap-4 mt-2">
                    <DetailItem label="Version" value={engineInfo?.ServerVersion} />
                    <div className="w-px h-6 bg-border/50" />
                    <DetailItem label="Root Dir" value={engineInfo?.DockerRootDir} />
                    <div className="w-px h-6 bg-border/50" />
                    <DetailItem label="Arch" value={engineInfo?.Architecture} />
                </div>
            }
            icon={Settings}
            actions={
                <div className="flex items-center gap-2 mb-1">
                    <Button variant="outline" onClick={fetchConfigs}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="gradient" onClick={() => { setEditConfig(null); setIsWizardOpen(true) }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Create Config
                    </Button>
                </div>
            }
        >
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <ResourceTable
                    title="Engine Registry"
                    description="List of configured Docker engine environments"
                    icon={<Database className="h-4 w-4" />}
                    loading={loading}
                    data={configs}
                    columns={[
                        { header: "Name", accessor: "name" },
                        { header: "Base URL", accessor: "base_url" },
                        {
                            header: "TLS",
                            accessor: "verify",
                            cell: (row: any) => (
                                <Badge variant={row.verify ? "success" : "warning"} className="uppercase text-[8px] h-4">
                                    {row.verify ? "Verified" : "Unverified"}
                                </Badge>
                            )
                        },
                        { 
                            header: "Status", 
                            accessor: "is_active",
                            cell: (row: any) => (
                                <Badge variant={row.is_active ? "success" : "secondary"} className="uppercase text-[10px]">
                                    {row.is_active ? "Active" : "Inactive"}
                                </Badge>
                            )
                        },
                    ]}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    customActions={[
                        {
                            label: "Use This",
                            icon: Activity,
                            onClick: handleActivate,
                            show: (row: any) => !row.is_active
                        }
                    ]}
                />
            </div>

            <FormWizard
                name="docker-config-wizard"
                isWizardOpen={isWizardOpen}
                setIsWizardOpen={setIsWizardOpen}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                steps={steps}
                schema={dockerConfigSchema}
                initialValues={editConfig || { name: "", base_url: "", verify: true, status: "active" }}
                onSubmit={async (values) => {
                    try {
                        if (editConfig) {
                            await (DefaultService as any).apiSettingsDockerConfigPut({ id: editConfig.id, requestBody: values })
                            toast.success("Updated Docker configuration")
                        } else {
                            await (DefaultService as any).apiSettingsDockerConfigPost({ requestBody: values })
                            toast.success("Created Docker configuration")
                        }
                        setIsWizardOpen(false)
                        fetchConfigs()
                    } catch (error) {
                        toast.error("Failed to save configuration")
                    }
                }}
                submitLabel={editConfig ? "Update" : "Create"}
                heading={{
                    primary: editConfig ? "Edit Engine Config" : "Create Engine Config",
                    secondary: "Configure Docker engine connection parameters",
                    icon: Server
                }}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Engine Config?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="text-foreground/80">
                                Are you sure you want to permanently delete <strong>{configToDelete?.name}</strong>?
                            </p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 font-medium">
                                    Removing this configuration will prevent the system from connecting to this Docker engine. Any services or operations relying on this context will fail.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-foreground border-none">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Config
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    )
}

const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">{label}</span>
        <span className="text-xs font-black text-slate-700">{value || 'N/A'}</span>
    </div>
)

export default DockerConfig

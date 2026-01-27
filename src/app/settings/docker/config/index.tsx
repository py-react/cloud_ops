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

const dockerConfigSchema = z.object({
    name: z.string().min(1, "Name is required"),
    base_url: z.string().min(1, "Base URL is required"),
    client_cert: z.string().optional(),
    client_key: z.string().optional(),
    ca_cert: z.string().optional(),
    verify: z.boolean().default(true),
    status: z.string().default("active"),
})

const DockerConfigForm = ({ control }: { control: any }) => {
    return (
        <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="client_cert"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Certificate Path</FormLabel>
                            <FormControl>
                                <Input placeholder="/path/to/cert.pem" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="client_key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Key Path</FormLabel>
                            <FormControl>
                                <Input placeholder="/path/to/key.pem" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={control}
                name="ca_cert"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CA Certificate Path</FormLabel>
                        <FormControl>
                            <Input placeholder="/path/to/ca.pem" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="verify"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-none">
                        <div className="space-y-0.5">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verify TLS</FormLabel>
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

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const data = await (DefaultService as any).apiSettingsDockerConfigGet()
            setConfigs(data || [])
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
        try {
            await (DefaultService as any).apiSettingsDockerConfigDelete({ id: row.id })
            toast.success("Deleted configuration")
            fetchConfigs()
        } catch (error) {
            toast.error("Failed to delete configuration")
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
            component: (props: any) => <DockerConfigForm {...props} />,
        }
    ]

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Docker Configuration</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <DetailItem label="Version" value={engineInfo?.ServerVersion} />
                                <div className="w-px h-6 bg-border/50" />
                                <DetailItem label="Root Dir" value={engineInfo?.DockerRootDir} />
                                <div className="w-px h-6 bg-border/50" />
                                <DetailItem label="Arch" value={engineInfo?.Architecture} />
                            </div>
                        </div>
                    </div>
                </div>
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
            </div>

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
                            render: (row: any) => (
                                <span className={row.verify ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                    {row.verify ? "Verified" : "Unverified"}
                                </span>
                            )
                        },
                        { header: "Status", accessor: "status" },
                    ]}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
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
        </div>
    )
}

const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">{label}</span>
        <span className="text-xs font-black text-slate-700">{value || 'N/A'}</span>
    </div>
)

export default DockerConfig

import React, { useState } from 'react'
import { PlusIcon, Box, Settings2Icon, CheckCircle2, FileCode2, Loader2, Download } from 'lucide-react'
import { FormWizard } from '@/components/wizard/form-wizard'
import { z } from 'zod'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileEditorStep } from './common/FileEditorStep'

export const registerAddonSchema = z.object({
    display_name: z.string().min(1, "Display Name is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    helm_repo_url: z.string().url("Must be a valid URL"),
    helm_chart_name: z.string().min(1, "Chart Name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    default_values: z.string().optional(),
    proxy_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    service_port: z.preprocess((val) => Number(val), z.number().int().positive().default(80)),
})

function slugify(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function repoNameFromUrl(url: string) {
    try {
        const parts = new URL(url).hostname.split('.')
        return parts[0] || 'helm-repo'
    } catch {
        return 'helm-repo'
    }
}

const BasicDetailsStep = ({ control }: any) => (
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
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                        <Input placeholder="System Metrics" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                        e.g. System Metrics, Storage &amp; Persistence, Networking &amp; Connectivity
                    </p>
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
                        The internal port where your service is listening (e.g. 80, 9093, 8080).
                    </p>
                    <FormMessage />
                </FormItem>
            )}
        />
    </div>
)

// HelmConfigStep receives setValue so it can inject fetched values into default_values
const HelmConfigStep = ({ control, watch, setValue }: any) => {
    const [loading, setLoading] = useState(false)
    const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const repoUrl   = watch('helm_repo_url') || ''
    const chartName = watch('helm_chart_name') || ''

    const canFetch = repoUrl.startsWith('http') && chartName.trim().length > 0

    const handleFetchDefaults = async () => {
        if (!canFetch) return
        setLoading(true)
        setFetchStatus('idle')
        try {
            const repoName = repoNameFromUrl(repoUrl)
            const fullChart = `${repoName}/${chartName}`
            const params = new URLSearchParams({
                action: 'fetch_values',
                repo_name: repoName,
                repo_url: repoUrl,
                chart_name: fullChart,
            })
            const res = await fetch(`/api/addons?${params}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setValue('default_values', data.values || '')
            setFetchStatus('success')
        } catch {
            setFetchStatus('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="helm_repo_url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Helm Repository URL</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="https://prometheus-community.github.io/helm-charts"
                                {...field}
                                onChange={(e) => { field.onChange(e); setFetchStatus('idle') }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="helm_chart_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Chart Name</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="kube-prometheus-stack"
                                {...field}
                                onChange={(e) => { field.onChange(e); setFetchStatus('idle') }}
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                            Just the chart name — the repo prefix is added automatically.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="namespace"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Deployment Namespace</FormLabel>
                        <FormControl>
                            <Input placeholder="monitoring" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Fetch defaults button — always visible once fields are filled */}
            <div className="pt-2 flex items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={!canFetch || loading}
                    onClick={handleFetchDefaults}
                >
                    {loading
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Fetching defaults…</>
                        : <><Download className="h-3 w-3" /> Load chart defaults into values editor</>
                    }
                </Button>
                {fetchStatus === 'success' && (
                    <span className="text-xs text-green-600 font-medium">✓ Values loaded — review them on the next step</span>
                )}
                {fetchStatus === 'error' && (
                    <span className="text-xs text-red-500">Failed to fetch. Check the repo URL and chart name.</span>
                )}
            </div>
        </div>
    )
}

const DefaultValuesStep = (props: any) => (
    <FileEditorStep
        {...props}
        fileName="values.yaml"
        label="These values were loaded from the chart's upstream defaults. Edit as needed — they will be used every time this addon is deployed."
        name="default_values"
    />
)

interface RegisterAddonWizardProps {
    onAddonCreated: () => void
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}

export function RegisterAddonWizard({ onAddonCreated, isOpen, setIsOpen }: RegisterAddonWizardProps) {
    const [currentStep, setCurrentStep] = useState('basic')

    const steps = [
        {
            id: 'basic',
            label: 'Basic Information',
            description: 'Name and categorize the addon',
            longDescription: 'Define how this addon is displayed and categorized in the essentials marketplace.',
            icon: Box,
            component: BasicDetailsStep
        },
        {
            id: 'helm',
            label: 'Helm Source',
            description: 'Chart location and namespace',
            longDescription: 'Provide the Helm repository URL, chart name, and deployment namespace. Use "Load chart defaults" to pre-fill the values editor.',
            icon: Settings2Icon,
            component: HelmConfigStep
        },
        {
            id: 'values',
            label: 'Default Values',
            description: 'Review and edit values.yaml',
            longDescription: 'These values are applied on every Deploy. They were pre-loaded from the chart upstream — edit to customise.',
            icon: FileCode2,
            component: DefaultValuesStep
        }
    ]

    const onSubmit = async (data: z.infer<typeof registerAddonSchema>) => {
        const repoName = repoNameFromUrl(data.helm_repo_url)
        const name = slugify(data.display_name)

        const response = await fetch('/api/addons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                plugin: {
                    name,
                    display_name: data.display_name,
                    description: data.description || '',
                    category: data.category,
                    helm_repo_name: repoName,
                    helm_repo_url: data.helm_repo_url,
                    helm_chart_name: `${repoName}/${data.helm_chart_name}`,
                    namespace: data.namespace,
                    default_values: data.default_values || null,
                    proxy_url: data.proxy_url || null,
                    service_port: data.service_port,
                    icon_name: 'Box'
                }
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to register addon')
        }

        setIsOpen(false)
        setCurrentStep('basic')
        onAddonCreated()
    }

    return (
        <FormWizard
            isWizardOpen={isOpen}
            setIsWizardOpen={(open) => {
                setIsOpen(open)
                if (!open) setCurrentStep('basic')
            }}
            steps={steps}
            initialValues={{
                display_name: '',
                category: '',
                description: '',
                helm_repo_url: '',
                helm_chart_name: '',
                namespace: 'default',
                default_values: '',
                proxy_url: '',
                service_port: 80
            }}
            schema={registerAddonSchema}
            onSubmit={onSubmit}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            heading={{
                primary: 'Register Addon',
                secondary: 'Add a Helm chart to the 1-click marketplace',
                icon: PlusIcon
            }}
            name="register-addon"
            submitLabel="Register Addon"
            submitIcon={CheckCircle2}
        />
    )
}

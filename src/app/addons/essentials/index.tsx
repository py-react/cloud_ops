import React, { useState, useEffect } from 'react'
import { AlertCircle, LayoutDashboard, Database, Activity, Box, PlusIcon, FileSearch } from 'lucide-react'
import PageLayout from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { DynamicAddonCard, DynamicAddon } from '@/components/addons/DynamicAddonCard'
import { RegisterAddonWizard } from '@/components/addons/RegisterAddonWizard'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

const CategoryIconMap: Record<string, any> = {
    'Alerting & Notifications': AlertCircle,
    'Visualization Dashboards': LayoutDashboard,
    'Logging & Infrastructure': Database,
    'Storage & Persistence': Database,
    'Networking & Connectivity': Activity,
    'System Metrics': Activity
}

const CategoryOrder = [
    'System Metrics',
    'Alerting & Notifications',
    'Visualization Dashboards',
    'Logging & Infrastructure',
    'Storage & Persistence',
    'Networking & Connectivity'
]

const SectionHeading = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-3 px-6 pt-8 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
)

export default function Essentials() {
    const [addons, setAddons] = useState<DynamicAddon[]>([])
    const [loading, setLoading] = useState(true)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const fetchAddons = async () => {
        try {
            const res = await fetch('/api/addons')
            const result = await res.json()
            if (result.data) {
                setAddons(result.data)
            }
        } catch (error) {
            console.error('Failed to load dynamic addons', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddons()
        if (isSettingsOpen) return;

        const interval = setInterval(fetchAddons, 30000)
        return () => clearInterval(interval)
    }, [isSettingsOpen])

    const userAddons = addons.filter(addon => !addon.is_system)
    const systemAddons = addons.filter(addon => addon.is_system)

    const groupedAddons = userAddons.reduce((acc, addon) => {
        const cat = addon.category || 'Uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(addon)
        return acc
    }, {} as Record<string, DynamicAddon[]>)

    const categoriesToRender = [...CategoryOrder]
    Object.keys(groupedAddons).forEach(cat => {
        if (!categoriesToRender.includes(cat)) {
            categoriesToRender.push(cat)
        }
    })

    const headerActions = (
        <Button
            onClick={() => setIsRegisterOpen(true)}
            className="h-9 text-xs gap-2"
        >
            <PlusIcon className="w-4 h-4" />
            Register Addon
        </Button>
    )

    return (
        <PageLayout
            title="Essentials"
            subtitle="1-Click Infrastructure Addons managed via Helm"
            actions={headerActions}
        >
            <RegisterAddonWizard
                isOpen={isRegisterOpen}
                setIsOpen={setIsRegisterOpen}
                onAddonCreated={fetchAddons}
            />



            {loading && (
                <div>
                    <div className="flex items-center gap-3 px-6 pt-8 pb-2 opacity-50 animate-pulse">
                        <div className="p-2 bg-primary/10 rounded-lg w-9 h-9" />
                        <div className="h-6 bg-primary/10 rounded w-48" />
                    </div>
                    <div className="flex flex-col gap-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm animate-pulse h-[280px]">
                                    <div className="p-6 h-full flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-5 bg-primary/10 rounded w-3/4" />
                                                <div className="h-4 bg-primary/10 rounded w-1/4" />
                                            </div>
                                        </div>
                                        <div className="space-y-3 mt-4">
                                            <div className="h-3 bg-primary/10 rounded w-full" />
                                            <div className="h-3 bg-primary/10 rounded w-5/6" />
                                            <div className="h-3 bg-primary/10 rounded w-4/6" />
                                        </div>
                                        <div className="mt-auto h-9 bg-primary/10 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!loading && categoriesToRender.map(category => {
                if (!groupedAddons[category] || groupedAddons[category].length === 0) return null

                const Icon = CategoryIconMap[category] || Box
                return (
                    <div key={category}>
                        <SectionHeading title={category} icon={Icon} />
                        <div className="flex flex-col gap-6 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                                {groupedAddons[category].map(addon => (
                                    <DynamicAddonCard
                                        key={addon.id}
                                        addon={addon}
                                        onStatusChange={fetchAddons}
                                        onSettingsToggle={setIsSettingsOpen}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}

            {userAddons.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-24">
                    <div className="p-4 bg-primary/5 rounded-full">
                        <Box className="w-10 h-10 text-primary/30" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">No addons registered yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Click <strong>Register Addon</strong> to add your first Helm chart.</p>
                    </div>
                    <Button
                        onClick={() => setIsRegisterOpen(true)}
                        variant="secondary"
                        className="h-9 text-xs gap-2 mt-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Register Your First Addon
                    </Button>
                </div>
            )}

            {!loading && (
                <div>
                    <SectionHeading title="Recommended Essentials" icon={Box} />
                    <div className="flex flex-col gap-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                            <MonitoringAddon
                                title="Gateway API"
                                description="The next generation of Kubernetes Ingress, Load Balancing, and Service Mesh APIs."
                                component="gateway-api"
                                icon={<Activity />}
                                features={[]}
                            />

                            {systemAddons.map(addon => (
                                <DynamicAddonCard
                                    key={addon.id}
                                    addon={addon}
                                    onStatusChange={fetchAddons}
                                    onSettingsToggle={setIsSettingsOpen}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    )
}

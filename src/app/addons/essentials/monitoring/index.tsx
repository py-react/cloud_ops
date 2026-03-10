import React, { useState, useEffect } from 'react'
import { Database, LayoutDashboard, Activity, LineChart, PlusIcon, FileSearch } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { DefaultService } from '@/gingerJs_api_client'
import PageLayout from '@/components/PageLayout'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

function Monitoring() {
    return (
        <PageLayout
            title="Monitoring"
            subtitle="Lightweight, 1-click infrastructure addons for your cluster."
            icon={LineChart}
        >
            <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    <MonitoringAddon
                        title="Prometheus"
                        description="Professional-grade time series database and monitoring server."
                        component="prometheus"
                        icon={<Database />}
                        features={[
                            // "Prometheus Server (v2.45.0)",
                            // "Kubernetes API Scraping",
                            // "Node Exporter Ready"
                        ]}
                        proxyUrl="/cluster/proxy/prometheus-service/monitoring/"
                    />



                    <MonitoringAddon
                        title="Metrics Server"
                        description="Cluster-wide aggregator of resource usage data."
                        component="metrics-server"
                        icon={<Activity />}
                        features={[
                            // "Resource Metrics API",
                            // "Enables Pod Autoscaler",
                            // "kubectl top support"
                        ]}
                    />

                    <div className="h-full">
                        <Card className="border border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-6 text-center hover:bg-primary/10 transition-all cursor-pointer group h-full min-h-[280px]">
                            <div className="p-3 bg-white/50 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <PlusIcon className="w-6 h-6 text-primary/40" />
                            </div>
                            <CardTitle className="text-sm font-bold text-primary/60">More coming</CardTitle>
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

export default Monitoring

import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import PageLayout from '@/components/PageLayout'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

function Dashboard() {
    return (
        <PageLayout
            title="Dashboard"
            subtitle="Access your Grafana dashboards and visualization tools."
            icon={LayoutDashboard}
        >
            <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    <MonitoringAddon
                        title="Grafana"
                        description="Beautiful anomaly detection and performance visualization dashboards."
                        component="grafana"
                        icon={<LayoutDashboard />}
                        features={[
                            // "Grafana Dashboard (v10.0.0)",
                            // "Anonymous Admin Access",
                            // "Pre-built Dashboards"
                        ]}
                        proxyUrl="/cluster/proxy/grafana/monitoring/"
                    />
                </div>
            </div>
        </PageLayout>
    )
}

export default Dashboard

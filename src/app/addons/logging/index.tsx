import React, { useState } from 'react'
import { Activity, Database, FileText } from 'lucide-react'
import { DefaultService } from '@/gingerJs_api_client'
import PageLayout from '@/components/PageLayout'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

function Logging() {
    return (
        <PageLayout
            title="Logging Stack"
            icon={FileText}
            subtitle="Centralized log aggregation and querying with Loki and Promtail."
        >
            <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    <MonitoringAddon
                        title="Loki"
                        description="Horizontally-scalable, highly-available, multi-tenant log aggregation system."
                        component="loki"
                        icon={<Database />}
                        proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-kubernetes-logs?orgId=1&refresh=1m"
                        features={[
                            "Loki (v2.9.2)",
                            "Persistent Storage",
                            "S3/GCS Support Ready"
                        ]}
                    />

                    <MonitoringAddon
                        title="Promtail"
                        description="Log shipping agent that discovers targets and enriches logs with labels."
                        component="promtail"
                        icon={<Activity />}
                        features={[
                            "Promtail Agent (v2.9.2)",
                            "Kubernetes Pod Discovery",
                            "Automatic Labeling"
                        ]}
                    />
                </div>
            </div>
        </PageLayout>
    )
}

export default Logging

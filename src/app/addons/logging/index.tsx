import React from 'react'
import { Activity, Database, FileText, FileSearch } from 'lucide-react'
import PageLayout from '@/components/PageLayout'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

function Logging() {
    return (
        <PageLayout
            title="Logging Stack"
            icon={FileText}
            subtitle="Centralized log aggregation and querying with Loki."
        >
            <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    <MonitoringAddon
                        title="Loki"
                        description="Horizontally-scalable, highly-available, multi-tenant log aggregation system."
                        component="loki"
                        icon={<Database />}
                        proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=$__all"
                        features={[
                            // "High-Performance Storage",
                            // "JSON Labeling",
                            // "S3/FS Backend Support"
                        ]}
                    />

                    <MonitoringAddon
                        title="OTel Collector"
                        description="The universal, standard-compliant observability agent for modern clusters."
                        component="otel-collector"
                        icon={<Activity />}
                        proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=otel"
                        features={[
                            // "Universal Ingestion",
                            // "Rich Processing",
                            // "Metadata Enrichment"
                        ]}
                    />

                    <MonitoringAddon
                        title="Promtail"
                        description="Native log shipping agent that discovers targets and enriches logs with labels."
                        component="promtail"
                        icon={<FileSearch />}
                        proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=promtail"
                        features={[
                            // "Fast & Native Ingestion",
                            // "Automatic K8s Labeling",
                            // "Low Resource Footprint"
                        ]}
                    />
                </div>
            </div>
        </PageLayout>
    )
}

export default Logging

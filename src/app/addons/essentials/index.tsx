import React, { useState, useEffect } from 'react'
import { AlertCircle, LineChart, PlusIcon, LayoutDashboard, Database, FileSearch, Activity } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { DefaultService } from '@/gingerJs_api_client'
import PageLayout from '@/components/PageLayout'
import { MonitoringAddon } from '@/components/addons/monitoring/MonitoringAddon'

import { AlertingAddon } from '@/components/addons/alerting/AlertingAddon'

const SectionHeading = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-3 px-6 pt-8 pb-2">
    <div className="p-2 bg-primary/10 rounded-lg">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
  </div>
)

function Monitoring() {
  const [prometheusInstalled, setPrometheusInstalled] = useState(false)

  useEffect(() => {
    const checkPrometheus = async () => {
      try {
        const response: any = await DefaultService.apiMonitoringInstallGet({ component: 'prometheus' })
        setPrometheusInstalled(!!response.installed)
      } catch (error) {
        console.error("Error checking Prometheus status:", error)
      }
    }
    checkPrometheus()
    // Poll every 5 seconds to keep visibility in sync
    const interval = setInterval(checkPrometheus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <PageLayout
      title="Essentials"
      subtitle=""
    >
      <SectionHeading title="Alerting & Notifications" icon={AlertCircle} />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {prometheusInstalled && (
            <AlertingAddon
              title="Prometheus Alert Manager"
              description="Professional-grade alerting with Alertmanager and opinionated rules."
              component="alertmanager"
              icon={<AlertCircle />}
              features={[
                // "Alertmanager (v0.25.0)",
                // "Node & Pod Health Rules",
                // "Webhook Ready"
              ]}
              proxyUrl="http://alertmanager-service.alerting.localhost"
            />
          )}

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
      <SectionHeading title="Visualization Dashboards" icon={LayoutDashboard} />
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
            proxyUrl="http://grafana.monitoring.localhost"
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
      <SectionHeading title="Logging & Infrastructure" icon={Database} />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          <MonitoringAddon
            title="Loki"
            description="Horizontally-scalable, highly-available, multi-tenant log aggregation system."
            component="loki"
            icon={<Database />}
            // proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=$__all"
            features={[
              // "High-Performance Storage",
              // "JSON Labeling",
              // "S3/FS Backend Support"
            ]}
          />



          <MonitoringAddon
            title="Promtail"
            description="Native log shipping agent that discovers targets and enriches logs with labels."
            component="promtail"
            icon={<FileSearch />}
            // proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=promtail"
            features={[
              // "Fast & Native Ingestion",
              // "Automatic K8s Labeling",
              // "Low Resource Footprint"
            ]}
          />

          <MonitoringAddon
            title="OTel Collector"
            description="The universal, standard-compliant observability agent for modern clusters."
            component="otel-collector"
            icon={<Activity />}
            // proxyUrl="/cluster/proxy/grafana/monitoring/d/loki-logs/loki-unified-logs?orgId=1&refresh=1m&var-agent=otel"
            features={[
              // "Universal Ingestion",
              // "Rich Processing",
              // "Metadata Enrichment"
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
      <SectionHeading title="Storage & Persistence" icon={Database} />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          <MonitoringAddon
            title="OpenEBS Replicated Storage"
            description="Highly available, replicated block storage for production-ready persistence."
            component="openebs"
            icon={<Database />}
            features={[
              "Distributed Replicas",
              "Data Persistence",
              "Snapshot Support"
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
      <SectionHeading title="Networking & Connectivity" icon={Activity} />
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          <MonitoringAddon
            title="Gateway API"
            description="The next generation of Kubernetes Ingress, Load Balancing, and Service Mesh APIs."
            component="gateway-api"
            icon={<Activity />}
            features={[
              // "Standard Channel (v1.0.0)",
              // "Gateway & HTTPRoute Support",
              // "Role-oriented Design"
            ]}
          />
          <MonitoringAddon
            title="Flannel"
            description="Simple and easy way to configure a layer 3 network fabric designed for Kubernetes."
            component="flannel"
            icon={<Activity />}
            features={[
              // "Layer 3 Network",
              // "Simple Configuration",
              // "Overlay Network"
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
      <SectionHeading title="System Metrics" icon={Activity} />
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
            proxyUrl="http://prometheus.monitoring.localhost"
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

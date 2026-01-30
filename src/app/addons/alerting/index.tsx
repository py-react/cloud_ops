import React, { useState, useEffect } from 'react'
import { AlertCircle, LineChart, PlusIcon } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { DefaultService } from '@/gingerJs_api_client'
import PageLayout from '@/components/PageLayout'

import { AlertingAddon } from '@/components/addons/alerting/AlertingAddon'

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
      title="Alerting"
      subtitle="Lightweight, 1-click infrastructure addons for your cluster."
      icon={LineChart}
    >
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
              proxyUrl="/cluster/proxy/alertmanager-service/alerting/"
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
    </PageLayout>
  )
}

export default Monitoring

import { useState } from 'react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'

interface UseAddonConfigProps {
    component: "prometheus" | "grafana" | "metrics-server" | "alertmanager" | "node-exporter" | "loki" | "promtail" | "otel-collector"
}

export function useAddonConfig({ component }: UseAddonConfigProps) {
    const [configs, setConfigs] = useState<Record<string, string>>({})
    const [isOpinionated, setIsOpinionated] = useState(true)
    const [configLoading, setConfigLoading] = useState(false)

    const fetchConfig = async () => {
        setConfigLoading(true)
        console.log(`[useAddonConfig] Fetching config for: ${component}`)
        try {
            // Components to fetch configs for
            let targets: string[] = [component];
            if (component === 'prometheus') {
                targets = ['prometheus', 'node-exporter', 'prometheus-rules'];
            } else if (component === 'grafana') {
                targets = ['grafana', 'grafana-dashboards', 'grafana-provider'];
            }
            const newConfigs: Record<string, string> = { ...configs }

            for (const target of targets) {
                const response = await fetch(`/api/monitoring/config?component=${target}`).then(res => res.json())
                console.log(`[useAddonConfig] Received config for ${target}:`, response)
                if (response.success) {
                    newConfigs[target] = response.config || ''
                    // Opinionated status usually matters for the primary component (e.g. AM or Prometheus)
                    if (target === component) {
                        setIsOpinionated(response.isOpinionated ?? false)
                    }
                } else {
                    toast.error(response.message || `Failed to fetch ${target} configuration`)
                }
            }
            setConfigs(newConfigs)
            return newConfigs
        } catch (error) {
            toast.error("An error occurred while fetching configuration")
            console.error(error)
            return configs
        } finally {
            setConfigLoading(false)
        }
    }

    const saveConfig = async (data: any, currentStep: string) => {
        setConfigLoading(true)
        try {
            // Determine which config we are saving based on currentStep
            let targetComponent: string = component;
            let targetConfig = data.config; // Default field

            if (component === 'prometheus') {
                if (currentStep === 'config') {
                    targetComponent = 'prometheus';
                    targetConfig = data.config;
                } else if (currentStep === 'prometheus-rules') {
                    targetComponent = 'prometheus-rules';
                    targetConfig = data.prometheus_rules_config;
                } else if (currentStep === 'node-exporter') {
                    targetComponent = 'node-exporter';
                    targetConfig = data.node_exporter_config;
                }
            } else if (component === 'grafana') {
                if (currentStep === 'config') {
                    targetComponent = 'grafana';
                    targetConfig = data.config;
                } else if (currentStep === 'grafana-dashboards') {
                    targetComponent = 'grafana-dashboards';
                    targetConfig = data.grafana_dashboards_config;
                } else if (currentStep === 'grafana-provider') {
                    targetComponent = 'grafana-provider';
                    targetConfig = data.grafana_provider_config;
                }
            }

            // @ts-ignore
            const response: any = await DefaultService.apiMonitoringConfigPost({
                requestBody: {
                    config: targetConfig,
                    component: targetComponent
                }
            })

            if (response.success) {
                toast.success(`${targetComponent.charAt(0).toUpperCase() + targetComponent.slice(1)} configuration updated!`)
                fetchConfig() // Refresh local state
                return true
            } else {
                toast.error(response.message || "Failed to update configuration")
                throw new Error(response.message)
            }
        } catch (error) {
            toast.error("An error occurred while updating configuration")
            console.error(error)
            throw error
        } finally {
            setConfigLoading(false)
        }
    }

    return {
        configs,
        isOpinionated,
        configLoading,
        fetchConfig,
        saveConfig
    }
}

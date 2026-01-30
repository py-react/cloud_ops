import { useState } from 'react'
import { DefaultService } from '@/gingerJs_api_client'
import { toast } from 'sonner'

interface UseAddonLifecycleProps {
    component: "prometheus" | "grafana" | "metrics-server" | "alertmanager" | "node-exporter"
    title: string
    onInstallChange?: (installed: boolean) => void
}

export function useAddonLifecycle({ component, title, onInstallChange }: UseAddonLifecycleProps) {
    const [loading, setLoading] = useState(false)
    const [installed, setInstalled] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [logs, setLogs] = useState<any[]>([])

    const checkStatus = async () => {
        try {
            const response: any = await DefaultService.apiMonitoringInstallGet({ component })
            const isInstalled = !!response.installed
            setInstalled(isInstalled)
            setDeleting(!!response.deleting)
            if (onInstallChange) onInstallChange(isInstalled)
            return isInstalled
        } catch (error) {
            console.error(`Error checking ${component} status:`, error)
            return false
        }
    }

    const deploy = async () => {
        setLoading(true)
        setLogs([])
        try {
            const response: any = await DefaultService.apiMonitoringInstallPost({ component })
            if (response.success) {
                toast.success(`${title} deployment initiated!`)
                setInstalled(true)
                setDeleting(false)
                setLogs((response.results as any[]) || [])
                if (onInstallChange) onInstallChange(true)
                return true
            } else {
                toast.error(response.message || `Failed to deploy ${title}`)
                return false
            }
        } catch (error) {
            toast.error(`An error occurred during ${title} installation`)
            console.error(error)
            return false
        } finally {
            setLoading(false)
        }
    }

    const remove = async () => {
        setLoading(true)
        setLogs([])
        try {
            const response: any = await DefaultService.apiMonitoringInstallDelete({ component })
            if (response.success) {
                toast.success(`${title} cleanup completed!`)
                setInstalled(false)
                setDeleting(true)
                setLogs((response.details as any[]) || [])
                if (onInstallChange) onInstallChange(false)
                return true
            } else {
                toast.error(response.message || `Failed to delete ${title}`)
                return false
            }
        } catch (error) {
            toast.error(`An error occurred during ${title} cleanup`)
            console.error(error)
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        installed,
        setInstalled,
        loading,
        deleting,
        logs,
        setLogs,
        deploy,
        remove,
        checkStatus
    }
}

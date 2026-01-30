import { useState } from 'react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'

export function useAlertTesting() {
    const [isTestLoading, setIsTestLoading] = useState(false)

    const testAlert = async (onSuccess: () => void) => {
        setIsTestLoading(true)
        try {
            // @ts-ignore - Endpoint may be new in client
            const response: any = await DefaultService.apiMonitoringTestAlertsPost()
            if (response.success) {
                toast.success("Test sequence initiated! Opening Live Stream...")
                onSuccess()
            } else {
                toast.error(response.message || "Failed to trigger test alerts")
            }
        } catch (error) {
            toast.error("An error occurred while testing alerts")
            console.error(error)
        } finally {
            setIsTestLoading(false)
        }
    }

    return {
        isTestLoading,
        testAlert
    }
}

import React, { useEffect, useState } from 'react'
import { DefaultService } from '@/gingerJs_api_client'
import { AlertCircle, Bell, Clock, Terminal } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/libs/utils'

export const LiveAlertLogsStep = () => {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        try {
            // @ts-ignore - Dynamic leaf fetch
            const response: any = await DefaultService.apiMonitoringWebhookTypeGet({ type: 'all' })
            if (response.success) {
                setLogs(response.logs || [])
            }
        } catch (error) {
            console.error("Error fetching alert logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        const interval = setInterval(fetchLogs, 3000) // Poll every 3 seconds
        return () => clearInterval(interval)
    }, [])

    if (loading && logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm">Listening for incoming alerts...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span>Real-time Alert Stream</span>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 animate-pulse">
                    Live Feed
                </Badge>
            </div>

            <ScrollArea className="h-[450px] pr-4">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-3 opacity-60">
                        <Bell className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-sm">No alerts received yet.<br />Try clicking "Test Alert" to trigger one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className={cn(
                                    "p-4 rounded-2xl border bg-card transition-all animate-in fade-in slide-in-from-right-2 duration-300",
                                    log.type === 'critical' ? "border-red-100 bg-red-50/10" :
                                        log.type === 'warning' ? "border-amber-100 bg-amber-50/10" :
                                            "border-blue-100 bg-blue-50/10"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            log.type === 'critical' ? "bg-red-500 shadow-sm" :
                                                log.type === 'warning' ? "bg-amber-500" :
                                                    "bg-blue-500"
                                        )} />
                                        <span className="font-semibold text-sm capitalize">
                                            {log.type} Alert
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-muted-foreground/20 text-muted-foreground lowercase font-mono">
                                            {log.source || 'unknown'}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {log.time}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                                        <span className="text-muted-foreground font-mono mr-1.5">[{log.source || 'unknown'}]</span>
                                        {log.data?.commonAnnotations?.summary || log.data?.alerts?.[0]?.annotations?.summary || "Alert received"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(log.data?.commonLabels || {}).slice(0, 3).map(([k, v]: any) => (
                                            <Badge key={k} variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 font-normal">
                                                {k}: {v}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900/70 leading-relaxed">
                    This stream shows all notifications hitting our dynamic webhook endpoints.
                    In-memory logs are cleared when the backend restarts.
                </p>
            </div>
        </div>
    )
}

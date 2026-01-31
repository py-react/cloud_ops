import React from 'react'
import { CheckCircle2, Loader2, LucideIcon, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/utils'

interface AddonCardProps {
    title: string
    description: string
    icon: React.ReactNode
    status?: 'installed' | 'deleting' | 'available'
    features?: string[]
    actions?: React.ReactNode
    className?: string
    footerActions?: React.ReactNode
    dashboardUrl?: string
}

const AddonCard: React.FC<AddonCardProps> = ({
    title,
    description,
    icon,
    status = 'available',
    features = [],
    actions,
    className,
    footerActions,
    dashboardUrl
}) => {
    return (
        <Card className={cn(
            "relative overflow-hidden border transition-all duration-300 flex flex-col h-full min-h-[280px]",
            status === 'installed' ? "border-green-500/20 shadow-green-500/5 bg-white" :
                status === 'deleting' ? "border-amber-500/20 shadow-amber-500/5 bg-amber-500/5" :
                    "border-primary/10 shadow-sm hover:border-primary/30 bg-white",
            className
        )}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/5 rounded-xl">
                            {icon}
                        </div>
                    </div>

                    <div className='flex gap-2 items-center'>
                        {status === 'installed' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                INSTALLED
                            </div>
                        )}
                        {status === 'deleting' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                DELETING
                            </div>
                        )}
                        {dashboardUrl && (
                            <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10 text-primary">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 min-h-[2rem] text-slate-500">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                {features.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                        {features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                                <CheckCircle2 className="w-3 h-3 text-green-500/70 flex-shrink-0" />
                                <span className="truncate">{feature}</span>
                            </div>
                        ))}
                    </div>
                )}
                {actions && <div className="mt-4">{actions}</div>}
            </CardContent>
            {footerActions && (
                <CardFooter className="p-4 pt-0">
                    <div className="w-full">
                        {footerActions}
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}

export default AddonCard

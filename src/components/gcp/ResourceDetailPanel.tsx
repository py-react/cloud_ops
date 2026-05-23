import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils';

interface DetailField {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}

interface ResourceAction {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
}

interface ResourceDetailPanelProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    fields: DetailField[];
    actions?: ResourceAction[];
    children?: React.ReactNode;
}

export function ResourceDetailPanel({
    open,
    onClose,
    title,
    subtitle,
    icon: Icon,
    fields,
    actions = [],
    children,
}: ResourceDetailPanelProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={cn(
                    "fixed right-0 top-0 h-full w-[420px] bg-background border-l border-border shadow-2xl z-50 flex flex-col",
                    "transition-transform duration-300 ease-in-out",
                    open ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border/60">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div>
                            <h2 className="font-black text-sm uppercase tracking-widest">{title}</h2>
                            {subtitle && (
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 border-b border-border/40 bg-muted/20">
                        {actions.map((action, i) => {
                            const ActionIcon = action.icon;
                            return (
                                <Button
                                    key={i}
                                    variant={action.variant || 'outline'}
                                    size="sm"
                                    onClick={action.onClick}
                                    disabled={action.disabled || action.loading}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <ActionIcon className={cn("w-3 h-3 mr-1.5", action.loading && "animate-spin")} />
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Fields */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {fields.map((field, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                {field.label}
                            </span>
                            {field.mono ? (
                                <code className="text-xs font-mono bg-muted/40 px-2 py-1.5 rounded-md break-all">
                                    {field.value}
                                </code>
                            ) : (
                                <span className="text-sm font-semibold text-foreground">{field.value}</span>
                            )}
                        </div>
                    ))}

                    {children}
                </div>
            </div>
        </>
    );
}

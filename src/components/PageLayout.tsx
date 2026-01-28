import React from 'react';
import BackButton from '@/components/BackButton';
import { LucideIcon } from 'lucide-react';

interface PageLayoutProps {
    title: string;
    subtitle?: React.ReactNode;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    children: React.ReactNode;
    showBackButton?: boolean;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    icon: Icon,
    actions,
    children,
    showBackButton = true,
    className = "",
    headerClassName = "",
    contentClassName = "",
}) => {
    return (
        <div className={`w-full h-full flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1 ${className}`}>
            {/* Page Header */}
            <div className={`flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2 ${headerClassName}`}>
                <div className="flex items-start gap-2">
                    {showBackButton && <BackButton className="mb-0 -ml-2 h-8 w-8" />}
                    <div className="flex items-center gap-4 mb-1 p-1">
                        {Icon && (
                            <div className="p-2.5 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                                <Icon className="h-6 w-6" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest leading-none">{title}</h1>
                            {subtitle && (
                                <div className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    {actions}
                </div>
            </div>
            <div className={`flex-1 min-h-0 flex flex-col ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default PageLayout;

import React from 'react';
import BackButton from '@/components/BackButton';
import { LucideIcon } from 'lucide-react';

interface HeaderLayoutProps {
    title: string;
    subtitle?: React.ReactNode;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    showBackButton?: boolean;
    className?: string;
}

const HeaderLayout: React.FC<HeaderLayoutProps> = ({
    title,
    subtitle,
    icon: Icon,
    actions,
    showBackButton = true,
    className = "",
}) => {
    return (
        <div className={`flex-none flex flex-col md:flex-row md:items-start justify-between gap-2 border-b border-border/100 pb-2 mb-2 ${className}`}>
            <div className="flex items-start gap-2">
                {showBackButton && <BackButton className="mb-0 -ml-2 h-8 w-8" />}
                <div className="flex items-start gap-4 mb-1 p-1">
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
            <div className="flex items-start gap-2 mb-1">
                {actions}
            </div>
        </div>
    );
};

export default HeaderLayout;

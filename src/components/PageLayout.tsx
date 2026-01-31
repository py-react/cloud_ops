import React from 'react';
import { LucideIcon } from 'lucide-react';
import HeaderLayout from './HeaderLayout';

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
    icon,
    actions,
    children,
    showBackButton = true,
    className = "",
    headerClassName = "",
    contentClassName = "",
}) => {
    return (
        <div className={`w-full h-full flex item-start flex-col animate-fade-in space-y-4 overflow-hidden pr-1 pb-6 ${className}`}>
            <HeaderLayout
                title={title}
                subtitle={subtitle}
                icon={icon}
                actions={actions}
                showBackButton={showBackButton}
                className={headerClassName}
            />
            <div className={`flex-1 px-6 min-h-0 flex flex-col ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default PageLayout;

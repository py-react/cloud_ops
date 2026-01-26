import React from 'react';
import { cn } from 'src/libs/utils';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type='button'
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                isActive
                  ? "bg-background text-foreground shadow-sm shadow-primary/5"
                  : "hover:bg-background/50 hover:text-foreground"
              )}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 border-b border-border/50 w-full", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            type='button'
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative group flex items-center h-12 px-4 text-sm font-semibold transition-all duration-200 outline-none",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2">
              {tab.icon && (
                <span className={cn(
                  "transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </div>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}

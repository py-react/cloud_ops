import { Loader2, TriangleAlert } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';

interface ResourceCardProps {
  title: string;
  count: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  isLoading?: boolean;
  error?: boolean;
  className?: string;
  unit?: string;
}

export function ResourceCard({
  title,
  count,
  icon,
  color,
  onClick,
  isLoading,
  error,
  className,
  unit,
}: ResourceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn("overflow-hidden border border-border/10 transition-all duration-300 p-4", className)}
    >
      <div className="relative h-full flex items-center gap-3">
        <div className={cn("flex-none p-2 rounded-lg text-white shadow-sm flex items-center justify-center", color)}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4.5 h-4.5' })}
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-1.5 mb-0">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground opacity-80 leading-none">{title}</h3>
            {isLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-baseline gap-0.5 mt-1">
            <span className="text-lg font-black tracking-tight leading-none tabular-nums text-foreground">
              {error ? (
                <TriangleAlert className="text-yellow-500 w-4 h-4" />
              ) : (
                count
              )}
            </span>
            {unit && !error && <span className="text-[10px] font-bold text-muted-foreground ml-0.5">{unit}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ResourceCard;
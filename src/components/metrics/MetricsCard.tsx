import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from 'src/libs/utils';

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  className?: string;
  iconClassName?: string;
}

export function MetricsCard({ icon: Icon, label, value, className, iconClassName }: MetricsCardProps) {
  return (
    <Card className={cn("flex items-center space-x-4", className)}>
      <div className={cn("p-3 rounded-full", iconClassName)}>
        {Icon && (
          <Icon className="w-6 h-6" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}
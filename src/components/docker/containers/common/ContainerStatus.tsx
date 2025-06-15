import React from 'react';
import { CheckCircle, AlertCircle, PauseCircle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from 'src/libs/utils';
import type { ContainerState } from 'src/types/container';

interface ContainerStatusProps {
  status: string;
  state: ContainerState;
}

export function ContainerStatus({ status, state }: ContainerStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-50',
          label: 'Running'
        };
      case 'exited':
        return {
          icon: XCircle,
          color: 'text-red-600 bg-red-50',
          label: 'Exited'
        };
      case 'paused':
        return {
          icon: PauseCircle,
          color: 'text-yellow-600 bg-yellow-50',
          label: 'Paused'
        };
      case 'restarting':
        return {
          icon: RefreshCw,
          color: 'text-blue-600 bg-blue-50',
          label: 'Restarting'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600 bg-gray-50',
          label: status
        };
    }
  };

  const { icon: Icon, color, label } = getStatusConfig();

  return (
    <div className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      color
    )}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {label}
    </div>
  );
}
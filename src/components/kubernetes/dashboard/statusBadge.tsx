import React from 'react';

type StatusType = 'healthy' | 'warning' | 'error' | 'unknown';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unknown':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusDot = () => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'unknown':
      default:
        return 'bg-gray-500';
    }
  };
  
  const displayText = text || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      <span className={`h-1.5 w-1.5 mr-1.5 rounded-full ${getStatusDot()}`} />
      {displayText}
    </span>
  );
};

export default StatusBadge;
import React from 'react';
import { Loader2 } from 'lucide-react';
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  
  export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    size = 'md', 
    className = '' 
  }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };
  
    return (
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
    );
  };

interface SkeletonLoaderProps {
  className?: string;
  rows?: number;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  rows = 1,
  height = 'h-4'
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div 
          key={index} 
          className={`bg-slate-200 rounded ${height} ${index > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </div>
  );
};

export const TableSkeletonLoader: React.FC = () => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 p-6 border-b border-slate-100">
          <div className="h-4 w-4 bg-slate-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          </div>
          <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const MetricSkeletonLoader: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-center w-12 h-12 bg-slate-200 rounded-xl mx-auto mb-2"></div>
      <div className="h-8 bg-slate-200 rounded w-16 mx-auto mb-1"></div>
      <div className="h-4 bg-slate-200 rounded w-20 mx-auto"></div>
    </div>
  );
};
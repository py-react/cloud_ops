import { Tooltip } from '@/components/ui/tooltip';
import { Loader2, TriangleAlert } from 'lucide-react';
import React from 'react';

interface ResourceCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  isLoading?:boolean
  error?:boolean
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  count,
  icon,
  color,
  onClick,
  isLoading,
  error
}) => {
  
  return (
    <div
      onClick={onClick}
      className={`bg-white hover:bg-gray-50 rounded-[0.5rem] shadow-sm border border-gray-200 p-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-[0.5rem] ${color}`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-800">
          {error ? (
                <TriangleAlert className="text-yellow-600" />
          ) : isLoading ? (
            <Loader2 className='animate-spin'/>
          ) : (
            count
          )}
        </span>
      </div>
      <h3 className="mt-2 font-medium text-gray-700">{title}</h3>
    </div>
  );
};

export default ResourceCard;
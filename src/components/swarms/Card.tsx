import React from 'react';
import { Button } from "@/components/ui/button"

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onViewDetails?: () => void;
}

export function Card({ title, icon, children, onViewDetails }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            {icon}
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="space-y-4">
          {children}
        </div>
        {onViewDetails && (
          <Button
            onClick={onViewDetails}
            className="w-full mt-4"
            variant="outline"
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}


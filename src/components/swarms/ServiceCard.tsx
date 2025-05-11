import React from 'react';
import { Layers, Box, RefreshCw } from 'lucide-react';
import { Card } from './Card';

interface ServiceCardProps {
  service: {
    ID: string;
    Name: string;
    Image: string;
    Replicas: number;
    Mode: string;
  };
  onViewDetails: () => void;
}

export function ServiceCard({ service, onViewDetails }: ServiceCardProps) {
  return (
    <Card
      title={service.Name}
      icon={<Layers className="w-5 h-5 text-blue-600" />}
      onViewDetails={onViewDetails}
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Box className="w-4 h-4" />
          <span>{service.Image}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw className="w-4 h-4" />
          <span>{service.Replicas} replicas</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Mode</span>
        <span className="font-medium text-blue-600">{service.Mode}</span>
      </div>
    </Card>
  );
}


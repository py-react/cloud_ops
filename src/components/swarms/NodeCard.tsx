import React from 'react';
import { Server, Cpu, HardDrive } from 'lucide-react';
import { Card } from './Card';

interface NodeCardProps {
  node: {
    ID: string;
    Hostname: string;
    Role: string;
    Status: string;
    CPUs: number;
    Memory: number;
  };
  onViewDetails: () => void;
}

export function NodeCard({ node, onViewDetails }: NodeCardProps) {
  return (
    <Card
      title={node.Hostname}
      icon={<Server className="w-5 h-5 text-blue-600" />}
      onViewDetails={onViewDetails}
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Cpu className="w-4 h-4" />
          <span>{node.CPUs} CPUs</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <HardDrive className="w-4 h-4" />
          <span>{node.Memory} GB RAM</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Role</span>
        <span className="font-medium text-blue-600">{node.Role}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Status</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          node.Status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {node.Status}
        </span>
      </div>
    </Card>
  );
}


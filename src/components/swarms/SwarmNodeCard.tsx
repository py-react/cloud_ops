'use client'

import React, { useState } from 'react';
import { Server, Cpu, HardDrive, Activity, Clock, Tag, MoreHorizontal } from 'lucide-react';
import { SwarmNodeDetailsModal } from './SwarmNodeDetailsModal';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SwarmNode {
  ID: string;
  Hostname: string;
  Status: {
    State: string;
    Addr: string;
  };
  Spec: {
    Role: string;
    Availability: string;
  };
  Description: {
    Platform: {
      Architecture: string;
      OS: string;
    };
    Resources: {
      NanoCPUs: number;
      MemoryBytes: number;
    };
  };
  CreatedAt: string;
  UpdatedAt: string;
  Version: {
    Index: number;
  };
  ManagerStatus?: {
    Leader: boolean;
    Reachability: string;
    Addr: string;
  };
}

interface SwarmNodeCardProps {
  node: SwarmNode;
}

export function SwarmNodeCard({ node }: SwarmNodeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleColor = (role: string) => {
    return role.toLowerCase() === 'manager' ? 'text-purple-600' : 'text-blue-600';
  };

  const formatCPU = (nanoCPUs: number) => {
    return (nanoCPUs / 1e9).toFixed(2);
  };

  const formatMemory = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getRoleColor(node.Spec.Role)} bg-opacity-10`}>
                <Server className={`w-5 h-5 ${getRoleColor(node.Spec.Role)}`} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{node.Hostname}</h3>
                <p className="text-sm text-gray-500">{node.ID.substring(0, 12)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(node.Status.State)}`}>
                {node.Status.State}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Update</DropdownMenuItem>
                  <DropdownMenuItem>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Cpu className="w-4 h-4" />
              <span>{formatCPU(node.Description.Resources.NanoCPUs)} CPUs</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <HardDrive className="w-4 h-4" />
              <span>{formatMemory(node.Description.Resources.MemoryBytes)} GB RAM</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <span className={`font-medium ${getRoleColor(node.Spec.Role)}`}>
                {node.Spec.Role}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Availability</span>
              <span className="font-medium text-gray-900">
                {node.Spec.Availability}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date(node.UpdatedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>Version {node.Version.Index}</span>
            </div>
          </div>

          <Button
            onClick={() => setShowDetails(true)}
            className="w-full mt-4"
            variant="outline"
          >
            View Details
          </Button>
        </div>
      </div>

      {showDetails && (
        <SwarmNodeDetailsModal
          node={node}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}


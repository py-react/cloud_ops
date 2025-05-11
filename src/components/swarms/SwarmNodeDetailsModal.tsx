import React from 'react';
import { Modal } from './Modal';
import { Button } from "@/components/ui/button"
import { Server, Cpu, HardDrive, Activity, Clock, Tag, Globe, Shield, Layers } from 'lucide-react';

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

interface SwarmNodeDetailsModalProps {
  node: SwarmNode;
  onClose: () => void;
}

export function SwarmNodeDetailsModal({ node, onClose }: SwarmNodeDetailsModalProps) {
  const formatCPU = (nanoCPUs: number) => {
    return (nanoCPUs / 1e9).toFixed(2);
  };

  const formatMemory = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Node Details: ${node.Hostname}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Server className="w-5 h-5" />
              <span className="font-medium">ID:</span>
            </div>
            <p className="text-sm text-gray-900">{node.ID}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Globe className="w-5 h-5" />
              <span className="font-medium">Address:</span>
            </div>
            <p className="text-sm text-gray-900">{node.Status.Addr}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Role:</span>
            </div>
            <p className="text-sm text-gray-900">{node.Spec.Role}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Status:</span>
            </div>
            <p className="text-sm text-gray-900">{node.Status.State}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Resources</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Cpu className="w-5 h-5" />
                <span className="font-medium">CPUs:</span>
              </div>
              <p className="text-sm text-gray-900">{formatCPU(node.Description.Resources.NanoCPUs)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <HardDrive className="w-5 h-5" />
                <span className="font-medium">Memory:</span>
              </div>
              <p className="text-sm text-gray-900">{formatMemory(node.Description.Resources.MemoryBytes)} GB</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Platform</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Layers className="w-5 h-5" />
                <span className="font-medium">OS:</span>
              </div>
              <p className="text-sm text-gray-900">{node.Description.Platform.OS}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Cpu className="w-5 h-5" />
                <span className="font-medium">Architecture:</span>
              </div>
              <p className="text-sm text-gray-900">{node.Description.Platform.Architecture}</p>
            </div>
          </div>
        </div>

        {node.ManagerStatus && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Manager Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Leader:</span>
                </div>
                <p className="text-sm text-gray-900">{node.ManagerStatus.Leader ? 'Yes' : 'No'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">Reachability:</span>
                </div>
                <p className="text-sm text-gray-900">{node.ManagerStatus.Reachability}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Timestamps</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Created:</span>
              </div>
              <p className="text-sm text-gray-900">{new Date(node.CreatedAt).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Updated:</span>
              </div>
              <p className="text-sm text-gray-900">{new Date(node.UpdatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}


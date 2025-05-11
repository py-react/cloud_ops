'use client'

import React, { useState } from 'react';
import { Server, Layers, Activity, Clock, Tag, MoreHorizontal, RefreshCw, Scale, List, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Modal } from './Modal';
import { Input } from "@/components/ui/input"
import { UpdateNodeForm } from './UpdateNodeForm'
import { UpdateServiceForm } from './UpdateServiceForm'

interface SwarmEntity {
  id: string;
  name: string;
  type: 'node' | 'service';
  status: string;
  details: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

interface SwarmEntityCardProps {
  entity: SwarmEntity;
  onReload: () => void;
  onUpdate: (data: any) => void;
  onScale?: (replicas: number) => void;
  onTasks?: () => void;
}

export function SwarmEntityCard({ entity, onReload, onUpdate, onScale, onTasks }: SwarmEntityCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [replicas, setReplicas] = useState(entity.details.Replicas as number || 1);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'down':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'node':
        return <Server className="w-5 h-5 text-blue-600" />;
      case 'service':
        return <Layers className="w-5 h-5 text-purple-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleScale = () => {
    if (onScale) {
      onScale(replicas);
      setShowScaleModal(false);
    }
  };

  const handleUpdate = (data: any) => {
    onUpdate(data);
    setShowUpdateModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getIcon(entity.type)}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{entity.name}</h3>
                <p className="text-sm text-gray-500">{entity.id.substring(0, 12)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entity.status)}`}>
                {entity.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setShowDetails(true)}>
                    <Activity className="w-4 h-4 mr-2" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onReload}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowUpdateModal(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Update
                  </DropdownMenuItem>
                  {entity.type === 'service' && (
                    <>
                      <DropdownMenuItem onSelect={() => setShowScaleModal(true)}>
                        <Scale className="w-4 h-4 mr-2" />
                        Scale
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={onTasks}>
                        <List className="w-4 h-4 mr-2" />
                        View Tasks
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(entity.details).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <span>{key}: {value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date(entity.updatedAt).toLocaleString()}</span>
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
        <Modal open={true} onClose={() => setShowDetails(false)} title={`${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} Details: ${entity.name}`}>
          <div className="space-y-4">
            {Object.entries(entity.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{new Date(entity.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Updated:</span>
              <span>{new Date(entity.updatedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {showScaleModal && (
        <Modal open={true} onClose={() => setShowScaleModal(false)} title={`Scale Service: ${entity.name}`}>
          <div className="space-y-4">
            <div>
              <label htmlFor="replicas" className="block text-sm font-medium text-gray-700">
                Number of Replicas
              </label>
              <Input
                type="number"
                id="replicas"
                value={replicas}
                onChange={(e) => setReplicas(parseInt(e.target.value))}
                min={1}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button onClick={() => setShowScaleModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleScale}>Scale</Button>
          </div>
        </Modal>
      )}

      {showUpdateModal && (
        <Modal open={true} onClose={() => setShowUpdateModal(false)} title={`Update ${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}: ${entity.name}`}>
          {entity.type === 'node' ? (
            <UpdateNodeForm onSubmit={handleUpdate} onClose={() => setShowUpdateModal(false)} />
          ) : (
            <UpdateServiceForm onSubmit={handleUpdate} onClose={() => setShowUpdateModal(false)} />
          )}
        </Modal>
      )}
    </>
  );
}


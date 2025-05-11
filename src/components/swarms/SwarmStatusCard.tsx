import React, { useState } from 'react';
import { Activity, RefreshCw, Lock, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from './Modal'
import { UpdateSwarmForm } from './UpdateSwarmForm'

interface SwarmStatusCardProps {
  status: {
    ID: string;
    Version: {
      Index: number;
    };
    CreatedAt: string;
    UpdatedAt: string;
    Nodes: number;
    Managers: number;
    Workers: number;
  };
  onReload: () => void;
  onGetUnlockKey: () => void;
  onUpdate: (data: any) => void;
}

export function SwarmStatusCard({ status, onReload, onGetUnlockKey, onUpdate }: SwarmStatusCardProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleUpdate = (data: any) => {
    onUpdate(data);
    setShowUpdateModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Swarm Status</CardTitle>
          <CardDescription>ID: {status.ID.substring(0, 12)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Nodes</span>
              <span className="font-medium text-blue-600">{status.Nodes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Managers</span>
              <span className="font-medium text-blue-600">{status.Managers}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Workers</span>
              <span className="font-medium text-blue-600">{status.Workers}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-blue-600">{status.Version.Index}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-medium text-blue-600">{new Date(status.CreatedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Updated</span>
              <span className="font-medium text-blue-600">{new Date(status.UpdatedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={onReload} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
            <Button onClick={onGetUnlockKey} size="sm" variant="outline">
              <Lock className="w-4 h-4 mr-2" />
              Get Unlock Key
            </Button>
            <Button onClick={() => setShowUpdateModal(true)} size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Swarm">
        <UpdateSwarmForm onSubmit={handleUpdate} onClose={() => setShowUpdateModal(false)} />
      </Modal>
    </>
  );
}


import React, { useState } from "react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Network } from "./types";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NetworkListResponse } from "@/gingerJs_api_client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NetworkDetails } from "./NetworkDetails";
import { toast } from "sonner";
import { Search } from "lucide-react";

export interface NetworkTableData {
  name: React.ReactNode;
  created: string;
  driver: string;
  scope: React.ReactNode;
  network: any;
}

interface INetworkList {
  networks: NetworkListResponse["items"];
  onDelete?: (id: string) => Promise<boolean>;
  onEdit?: (data: NetworkTableData) => Promise<void>;
  onBulkDelete?: (networks: NetworkTableData[]) => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}

export function NetworkList({ networks, onDelete, onEdit, onBulkDelete, title, description, icon, extraHeaderContent }: INetworkList) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [networkToDelete, setNetworkToDelete] = useState<NetworkTableData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  const handleDeleteClick = (data: NetworkTableData) => {
    setNetworkToDelete(data);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (data: NetworkTableData) => {
    setSelectedNetwork(data.network);
    setShowDetails(true);
  };

  const handleDeleteConfirm = async () => {
    if (!networkToDelete || !onDelete) return;
    setDeletingId(networkToDelete.network.Id);
    try {
      await onDelete(networkToDelete.network.Id);
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setNetworkToDelete(null);
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Driver", accessor: "driver" },
    { header: "Scope", accessor: "scope" },
    { header: "Created", accessor: "created" },
  ];

  const data: NetworkTableData[] = networks.map((network) => ({
    name: (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm text-foreground tracking-tight">{network.Name}</span>
      </div>
    ),
    created: format(new Date(network.Created), 'PPP'),
    driver: network.Driver,
    scope: (
      <Badge variant="outline" className="bg-primary/5">
        {network.Scope}
      </Badge>
    ),
    network,
  }));

  return (
    <>
      <ResourceTable
        columns={columns}
        data={data}
        onDelete={handleDeleteClick}
        onEdit={onEdit}
        onViewDetails={handleViewDetails}
        onBulkDelete={onBulkDelete}
        tableClassName="max-h-[550px]"
        title={title}
        description={description}
        icon={icon}
        extraHeaderContent={extraHeaderContent}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Network</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Are you sure you want to delete the network "{networkToDelete?.network.Name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId === networkToDelete?.network.Id}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
            >
              {deletingId === networkToDelete?.network.Id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border border-border/50 bg-background shadow-2xl rounded-3xl">
          <DialogHeader className="py-6 px-8 border-b border-border/30 bg-muted/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Network Details</DialogTitle>
                <DialogDescription className="text-xs font-medium">Inspecting {selectedNetwork?.Name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-8 py-6">
            {selectedNetwork && <NetworkDetails network={selectedNetwork} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

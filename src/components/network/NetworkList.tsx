import React, { useState } from "react";
import { ResourceTable } from "../kubernetes/resources/resourceTable";
import { Network } from "./types";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NetworkListResponse } from "@/gingerJs_api_client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NetworkDetails } from "./NetworkDetails";
import { toast } from "sonner";

interface NetworkTableData {
  name: string;
  created: string;
  driver: string;
  scope: React.ReactNode;
  network: Network;
}

interface INetworkList {
  networks: NetworkListResponse["items"];
  onDelete?: (id: string) => Promise<boolean>;
  onEdit?: (data: NetworkTableData) => Promise<void>;
}

export function NetworkList({ networks, onDelete, onEdit }: INetworkList) {
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
    name: network.Name,
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
        tableClassName="max-h-[490px]"
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Network</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the network "{networkToDelete?.network.Name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId === networkToDelete?.network.Id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === networkToDelete?.network.Id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="!w-[30%] sm:!max-w-[30%]">
          <SheetHeader>
            <SheetTitle>Network Details</SheetTitle>
          </SheetHeader>
          {selectedNetwork && <NetworkDetails network={selectedNetwork} />}
        </SheetContent>
      </Sheet>
    </>
  );
} 
import React, { useState } from 'react';
import { StorageInfo } from '@/types/storage';
import { ResourceTable } from "../kubernetes/resources/resourceTable";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StorageDetails } from './StorageDetails';

interface StorageTableData {
  name: string;
  created: string;
  driver: string;
  scope: React.ReactNode;
  inUse:React.ReactNode,
  storage: StorageInfo;
}

interface StoragesListProps {
  storages: StorageInfo[];
  onDelete: (id: string) => Promise<boolean>;
}

export const StoragesList: React.FC<StoragesListProps> = ({ storages, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storageToDelete, setStorageToDelete] = useState<StorageTableData | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<StorageInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleDeleteClick = (data: StorageTableData) => {
    setStorageToDelete(data);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!storageToDelete) return;
    setDeletingId(storageToDelete.storage.name);
    try {
      await onDelete(storageToDelete.storage.name);
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setStorageToDelete(null);
    }
  };

  const handleViewDetails = (data: StorageTableData) => {
    setSelectedStorage(data.storage);
    setShowDetails(true);
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Driver", accessor: "driver" },
    { header: "In Use", accessor: "inUse" },
    { header: "Scope", accessor: "scope" },
    { header: "Created", accessor: "created" },
  ];

  const data: StorageTableData[] = storages.map((storage) => ({
    name: storage.name,
    created: format(new Date(storage.created), 'PPP'),
    driver: storage.driver,
    inUse:(
      <Badge variant={storage.inUse ? "default" : "secondary"}>
        {storage.inUse ? "In Use" : "Not In Use"}
      </Badge>
    ),
    scope: (
      <Badge variant="outline" className="bg-primary/5">
        {storage.scope}
      </Badge>
    ),
    storage,
  }));

  return (
    <>
      <ResourceTable
        columns={columns}
        data={data}
        onDelete={handleDeleteClick}
        onViewDetails={handleViewDetails}
        tableClassName="max-h-[490px]"
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Volume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the volume "{storageToDelete?.storage.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId === storageToDelete?.storage.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === storageToDelete?.storage.name ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="!w-[30%] sm:!max-w-[30%]">
          <SheetHeader>
            <SheetTitle>Volume Details</SheetTitle>
          </SheetHeader>
          {selectedStorage && <StorageDetails storage={selectedStorage} />}
        </SheetContent>
      </Sheet>
    </>
  );
};
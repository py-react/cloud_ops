import React, { useState } from 'react';
import { StorageInfo } from '@/types/storage';
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { HardDrive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StorageDetails } from './StorageDetails';

interface StorageTableData {
  name: React.ReactNode;
  created: string;
  driver: string;
  scope: React.ReactNode;
  inUse: React.ReactNode,
  storage: StorageInfo;
}

interface StoragesListProps {
  storages: StorageInfo[];
  onDelete: (id: string) => Promise<boolean>;
  onBulkDelete?: (storages: StorageTableData[]) => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}

export const StoragesList: React.FC<StoragesListProps> = ({ storages, onDelete, onBulkDelete, title, description, icon, extraHeaderContent }) => {
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
    name: (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm text-foreground tracking-tight">{storage.name}</span>
      </div>
    ),
    created: format(new Date(storage.created), 'PPP'),
    driver: storage.driver,
    inUse: (
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
        onBulkDelete={onBulkDelete}
        tableClassName="max-h-[550px]"
        title={title}
        description={description}
        icon={icon}
        extraHeaderContent={extraHeaderContent}
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

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-border/30 bg-background shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
          <DialogHeader className="py-6 px-8 border-b border-border/30 bg-muted/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <HardDrive className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <DialogTitle className="text-2xl font-bold tracking-tight">Volume Details</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium">Inspect Docker volume configuration and mount point</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto px-8 py-6">
            {selectedStorage && <StorageDetails storage={selectedStorage} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
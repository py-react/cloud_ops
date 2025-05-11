import React from 'react';
import { StorageCard } from './StorageCard';
import { useStoragesFilters } from './hooks/useStoragesFilters';
import type { StorageInfo } from 'src/types/storage';

interface StoragesListProps {
  storages: StorageInfo[];
  setStorages:React.Dispatch<React.SetStateAction<any[]>>
}

export function StoragesList({ storages,setStorages }: StoragesListProps) {
  const { filteredStorages } = useStoragesFilters(storages);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStorages?.map((storage) => (
          <StorageCard
            key={storage.name}
            storage={storage}
            setStorages={setStorages}
          />
        ))}
      </div>

      {filteredStorages?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No Storage found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
import { useState, useMemo } from 'react';
import type { StorageInfo } from 'src/types/storage';

export function useStoragesFilters(storages: StorageInfo[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredStorages = useMemo(() => {
    return storages.filter(storage => {
      const matchesSearch = search === '' || 
        storage.name.toLowerCase().includes(search.toLowerCase()) ||
        storage.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === '' || storage.name.includes(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [storages, search, statusFilter]);

  return {
    search,
    onSearchChange: setSearch,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    filteredStorages,
  };
}
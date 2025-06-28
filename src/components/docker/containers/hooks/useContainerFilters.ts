import { useState, useMemo } from 'react';
import type { Container } from 'src/types/container';

export function useContainerFilters(containers: Container[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredContainers = useMemo(() => {
    return containers.filter(container => {
      const matchesSearch = search === '' || 
        container.name.toLowerCase().includes(search.toLowerCase()) ||
        container.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === '' || container.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [containers, search, statusFilter]);


  return {
    search,
    onSearchChange: setSearch,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    filteredContainers,
  };
}
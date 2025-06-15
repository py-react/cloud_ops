import { useState, useMemo } from 'react';
import type { PackageInfo } from 'src/types/package';

export function usePackagesFilters(packages: PackageInfo[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredPackages = useMemo(() => {
    return packages.filter(container => {
      const matchesSearch = search === '' || 
        container.name.toLowerCase().includes(search.toLowerCase()) ||
        container.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === '' || container.tags.includes(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [packages, search, statusFilter]);

  return {
    search,
    onSearchChange: setSearch,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    filteredPackages,
  };
}
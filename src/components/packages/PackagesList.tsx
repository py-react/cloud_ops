import React from 'react';
import { PackageCard } from './PackageCard';
import { usePackagesFilters } from './hooks/usePackageFilters';
import type { PackageInfo } from 'src/types/package';

interface PackagesListProps {
  packages: PackageInfo[];
  setPackages:React.Dispatch<React.SetStateAction<any[]>>
}

export function PackagesList({ packages,setPackages }: PackagesListProps) {
  const { filteredPackages } = usePackagesFilters(packages);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages?.map((packge) => (
          <PackageCard
            key={packge.id}
            packageItem={packge}
            setPackages={setPackages}
          />
        ))}
      </div>
      
      {filteredPackages?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No packages found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
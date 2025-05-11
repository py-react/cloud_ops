import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PersistentVolumeTableProps {
  resources: any[];
}

export function PersistentVolumeTable({ resources }: PersistentVolumeTableProps) {
  const getStatusVariant = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'bound':
        return "default";
      case 'available':
        return "secondary";
      case 'released':
        return "outline";
      case 'failed':
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCapacity = (capacity: any) => {
    if (!capacity) return 'N/A';
    return capacity.storage || 'N/A';
  };

  const getAccessModes = (modes: string[]) => {
    if (!modes?.length) return 'None';
    return modes.map(mode => (
      <Badge key={mode} variant="outline" className="mr-1">
        {mode}
      </Badge>
    ));
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Access Modes</TableHead>
            <TableHead>Reclaim Policy</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Claim</TableHead>
            <TableHead>Storage Class</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((volume) => {
            const capacity = formatCapacity(volume.spec?.capacity);
            const accessModes = volume.spec?.accessModes || [];
            const reclaimPolicy = volume.spec?.persistentVolumeReclaimPolicy;
            const phase = volume.status?.phase;
            const claim = volume.spec?.claimRef ? 
              `${volume.spec.claimRef.namespace}/${volume.spec.claimRef.name}` : 
              'None';
            const storageClass = volume.spec?.storageClassName || 'None';

            return (
              <TableRow key={volume.metadata.name}>
                <TableCell>{volume.metadata.name}</TableCell>
                <TableCell>{capacity}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {getAccessModes(accessModes)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {reclaimPolicy}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(phase)}>
                    {phase}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={claim}>
                  {claim}
                </TableCell>
                <TableCell>{storageClass}</TableCell>
                <TableCell>
                  {new Date(volume.metadata.creationTimestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
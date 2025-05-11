import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PersistentVolumeClaimTableProps {
  resources: any[];
}

export function PersistentVolumeClaimTable({ resources }: PersistentVolumeClaimTableProps) {
  const getStatusVariant = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'bound':
        return "default";
      case 'pending':
        return "secondary";
      case 'lost':
        return "destructive";
      default:
        return "outline";
    }
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
            <TableHead>Namespace</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Access Modes</TableHead>
            <TableHead>Storage Class</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((claim) => {
            const phase = claim.status?.phase;
            const volume = claim.spec?.volumeName || 'None';
            const capacity = claim.status?.capacity?.storage || claim.spec?.resources?.requests?.storage || 'N/A';
            const accessModes = claim.spec?.accessModes || [];
            const storageClass = claim.spec?.storageClassName || 'None';

            return (
              <TableRow key={`${claim.metadata.namespace}-${claim.metadata.name}`}>
                <TableCell>{claim.metadata.name}</TableCell>
                <TableCell>{claim.metadata.namespace}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(phase)}>
                    {phase}
                  </Badge>
                </TableCell>
                <TableCell>{volume}</TableCell>
                <TableCell>{capacity}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {getAccessModes(accessModes)}
                </TableCell>
                <TableCell>{storageClass}</TableCell>
                <TableCell>
                  {new Date(claim.metadata.creationTimestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
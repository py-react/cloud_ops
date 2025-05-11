import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StorageClassTableProps {
  resources: any[];
}

export function StorageClassTable({ resources }: StorageClassTableProps) {
  const getDefaultClassVariant = (isDefault: boolean) => {
    return isDefault ? "default" : "outline";
  };

  const formatParameters = (parameters: Record<string, string>) => {
    if (!parameters || Object.keys(parameters).length === 0) return 'None';
    
    return Object.entries(parameters).map(([key, value]) => (
      <Badge key={key} variant="outline" className="mr-1 mb-1">
        {key}={value}
      </Badge>
    ));
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provisioner</TableHead>
            <TableHead>Reclaim Policy</TableHead>
            <TableHead>Volume Binding Mode</TableHead>
            <TableHead>Allow Volume Expansion</TableHead>
            <TableHead>Parameters</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((storageClass) => {
            const isDefault = storageClass.metadata.annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true';
            const name = storageClass.metadata.name;
            const displayName = isDefault ? `${name} (default)` : name;

            return (
              <TableRow key={storageClass.metadata.name}>
                <TableCell>
                  <Badge variant={getDefaultClassVariant(isDefault)}>
                    {displayName}
                  </Badge>
                </TableCell>
                <TableCell>{storageClass.provisioner}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {storageClass.reclaimPolicy || 'Delete'}
                  </Badge>
                </TableCell>
                <TableCell>{storageClass.volumeBindingMode}</TableCell>
                <TableCell>
                  <Badge variant={storageClass.allowVolumeExpansion ? "default" : "outline"}>
                    {storageClass.allowVolumeExpansion ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex flex-wrap">
                    {formatParameters(storageClass.parameters)}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(storageClass.metadata.creationTimestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
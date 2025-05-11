import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EndpointsTableProps {
  resources: any[];
}

export function EndpointsTable({ resources }: EndpointsTableProps) {
  const formatSubsets = (subsets: any[]) => {
    if (!subsets?.length) return 'No endpoints';
    
    return subsets.map((subset, subsetIndex) => {
      const addresses = subset.addresses?.map((addr: any) => addr.ip).join(', ') || 'None';
      const notReadyAddresses = subset.notReadyAddresses?.map((addr: any) => addr.ip).join(', ');
      const ports = subset.ports?.map((port: any) => {
        const protocol = port.protocol || 'TCP';
        const name = port.name ? `${port.name}: ` : '';
        return (
          <Badge key={`${port.port}-${protocol}`} variant="outline" className="mr-1 mb-1">
            {name}{port.port}/{protocol}
          </Badge>
        );
      });

      return (
        <div key={subsetIndex} className="mb-2">
          <div className="flex flex-wrap gap-1 mb-1">
            <Badge variant="default">{addresses}</Badge>
            {notReadyAddresses && (
              <Badge variant="destructive">{notReadyAddresses}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {ports}
          </div>
        </div>
      );
    });
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead className="w-2/3">Endpoints</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((endpoint) => (
            <TableRow key={`${endpoint.metadata.namespace}-${endpoint.metadata.name}`}>
              <TableCell>{endpoint.metadata.name}</TableCell>
              <TableCell>{endpoint.metadata.namespace}</TableCell>
              <TableCell>
                <div className="max-h-40 overflow-y-auto">
                  {formatSubsets(endpoint.subsets)}
                </div>
              </TableCell>
              <TableCell>
                {new Date(endpoint.metadata.creationTimestamp).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 
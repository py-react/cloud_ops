import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StatefulSetTableProps {
  resources: any[];
}

export function StatefulSetTable({ resources }: StatefulSetTableProps) {
  const getReadyStatusVariant = (ready: number, total: number) => {
    if (ready === total) return "default";
    if (ready > 0) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Ready</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Storage Class</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((statefulset) => {
            const readyReplicas = statefulset.status?.readyReplicas || 0;
            const replicas = statefulset.spec?.replicas || 0;
            const currentReplicas = statefulset.status?.currentReplicas || 0;
            const updatedReplicas = statefulset.status?.updatedReplicas || 0;
            const storageClass = statefulset.spec?.volumeClaimTemplates?.[0]?.spec?.storageClassName || 'N/A';

            return (
              <TableRow key={`${statefulset.metadata.namespace}-${statefulset.metadata.name}`}>
                <TableCell>{statefulset.metadata.name}</TableCell>
                <TableCell>{statefulset.metadata.namespace}</TableCell>
                <TableCell>
                  <Badge variant={getReadyStatusVariant(readyReplicas, replicas)}>
                    {readyReplicas}/{replicas}
                  </Badge>
                </TableCell>
                <TableCell>{currentReplicas}</TableCell>
                <TableCell>{updatedReplicas}</TableCell>
                <TableCell>{storageClass}</TableCell>
                <TableCell>{new Date(statefulset.metadata.creationTimestamp).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
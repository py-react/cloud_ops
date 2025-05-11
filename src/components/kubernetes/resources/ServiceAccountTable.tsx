import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ServiceAccountTableProps {
  resources: any[];
}

export function ServiceAccountTable({ resources }: ServiceAccountTableProps) {
  const formatSecretList = (secrets: any[]) => {
    if (!secrets?.length) return 'None';
    return secrets.map((secret) => (
      <Badge key={secret.name} variant="outline" className="mr-1 mb-1">
        {secret.name}
      </Badge>
    ));
  };

  const formatImagePullSecrets = (secrets: any[]) => {
    if (!secrets?.length) return 'None';
    return secrets.map((secret) => (
      <Badge key={secret.name} variant="secondary" className="mr-1 mb-1">
        {secret.name}
      </Badge>
    ));
  };

  const getAutomountVariant = (automount: boolean | undefined) => {
    if (automount === undefined) return "outline";
    return automount ? "default" : "destructive";
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Automount Token</TableHead>
            <TableHead>Secrets</TableHead>
            <TableHead>Image Pull Secrets</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((sa) => {
            const automountToken = sa.automountServiceAccountToken;
            const secrets = sa.secrets || [];
            const imagePullSecrets = sa.imagePullSecrets || [];

            return (
              <TableRow key={`${sa.metadata.namespace}-${sa.metadata.name}`}>
                <TableCell>{sa.metadata.name}</TableCell>
                <TableCell>{sa.metadata.namespace}</TableCell>
                <TableCell>
                  <Badge variant={getAutomountVariant(automountToken)}>
                    {automountToken === undefined ? 'Default' : (automountToken ? 'Yes' : 'No')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap">
                    {formatSecretList(secrets)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap">
                    {formatImagePullSecrets(imagePullSecrets)}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(sa.metadata.creationTimestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
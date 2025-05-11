import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CustomResourceDefinitionTableProps {
  resources: any[];
}

export function CustomResourceDefinitionTable({ resources }: CustomResourceDefinitionTableProps) {
  const formatVersions = (versions: any[]) => {
    if (!versions?.length) return 'No versions';
    
    return versions.map((version) => {
      const isStored = version.storage;
      const isServed = version.served;
      
      return (
        <div key={version.name} className="mb-1">
          <Badge 
            variant={isStored ? "default" : (isServed ? "secondary" : "outline")}
            className="mr-1"
          >
            {version.name}
            {isStored && ' (storage)'}
          </Badge>
        </div>
      );
    });
  };

  const formatScope = (scope: string) => {
    switch (scope) {
      case 'Namespaced':
        return <Badge variant="default">Namespaced</Badge>;
      case 'Cluster':
        return <Badge variant="secondary">Cluster</Badge>;
      default:
        return <Badge variant="outline">{scope}</Badge>;
    }
  };

  const formatGroup = (group: string) => {
    return group.split('.').map((part, index, array) => (
      <React.Fragment key={index}>
        {part}
        {index < array.length - 1 && <span className="text-muted-foreground">.</span>}
      </React.Fragment>
    ));
  };

  const getValidationStatus = (schema: any) => {
    if (!schema) return <Badge variant="outline">None</Badge>;
    if (schema.openAPIV3Schema) {
      return <Badge variant="default">OpenAPI V3</Badge>;
    }
    return <Badge variant="secondary">Custom</Badge>;
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Versions</TableHead>
            <TableHead>Validation</TableHead>
            <TableHead>Short Names</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((crd) => {
            const spec = crd.spec;
            const shortNames = spec.names.shortNames || [];
            const validation = spec.validation || spec.versions?.[0]?.schema;

            return (
              <TableRow key={crd.metadata.name}>
                <TableCell>{spec.names.kind}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatGroup(spec.group)}
                </TableCell>
                <TableCell>
                  {formatScope(spec.scope)}
                </TableCell>
                <TableCell>
                  <div className="max-h-32 overflow-y-auto">
                    {formatVersions(spec.versions)}
                  </div>
                </TableCell>
                <TableCell>
                  {getValidationStatus(validation)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {shortNames.map((name: string) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(crd.metadata.creationTimestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
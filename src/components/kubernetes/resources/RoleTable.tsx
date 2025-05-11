import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RoleTableProps {
  resources: any[];
}

export function RoleTable({ resources }: RoleTableProps) {
  const formatRules = (rules: any[]) => {
    if (!rules?.length) return 'No Rules';
    
    return rules.map((rule, index) => {
      const apiGroups = rule.apiGroups?.length ? rule.apiGroups.join(', ') : '';
      const resources = rule.resources?.join(', ') || '*';
      const verbs = rule.verbs?.join(', ') || '*';
      
      return (
        <div key={index} className="mb-1">
          <Badge variant="outline" className="mr-1">
            {apiGroups || 'core'}/{resources}
          </Badge>
          <Badge variant="secondary">
            {verbs}
          </Badge>
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
            <TableHead className="w-1/2">Rules</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((role) => (
            <TableRow key={`${role.metadata.namespace}-${role.metadata.name}`}>
              <TableCell>{role.metadata.name}</TableCell>
              <TableCell>{role.metadata.namespace}</TableCell>
              <TableCell>
                <div className="max-h-32 overflow-y-auto">
                  {formatRules(role.rules)}
                </div>
              </TableCell>
              <TableCell>
                {new Date(role.metadata.creationTimestamp).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 
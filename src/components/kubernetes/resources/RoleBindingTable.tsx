import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RoleBindingTableProps {
  resources: any[];
}

export function RoleBindingTable({ resources }: RoleBindingTableProps) {
  const getSubjectVariant = (kind: string) => {
    switch (kind?.toLowerCase()) {
      case 'user':
        return "default";
      case 'group':
        return "secondary";
      case 'serviceaccount':
        return "outline";
      default:
        return "outline";
    }
  };

  const formatSubjects = (subjects: any[]) => {
    if (!subjects?.length) return 'No subjects';
    
    return subjects.map((subject, index) => {
      const name = subject.namespace ? 
        `${subject.namespace}/${subject.name}` : 
        subject.name;
      
      return (
        <div key={index} className="mb-1">
          <Badge variant={getSubjectVariant(subject.kind)} className="mr-1">
            {subject.kind}
          </Badge>
          <Badge variant="outline">
            {name}
          </Badge>
        </div>
      );
    });
  };

  const formatRoleRef = (roleRef: any) => {
    if (!roleRef) return 'None';
    
    const name = roleRef.namespace ? 
      `${roleRef.namespace}/${roleRef.name}` : 
      roleRef.name;
    
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary">
          {roleRef.kind}
        </Badge>
        <Badge variant="outline">
          {name}
        </Badge>
        {roleRef.apiGroup && (
          <Badge variant="outline" className="opacity-75">
            {roleRef.apiGroup}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Role Reference</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((binding) => (
            <TableRow key={`${binding.metadata.namespace}-${binding.metadata.name}`}>
              <TableCell>{binding.metadata.name}</TableCell>
              <TableCell>{binding.metadata.namespace}</TableCell>
              <TableCell>
                {formatRoleRef(binding.roleRef)}
              </TableCell>
              <TableCell>
                <div className="max-h-32 overflow-y-auto">
                  {formatSubjects(binding.subjects)}
                </div>
              </TableCell>
              <TableCell>
                {new Date(binding.metadata.creationTimestamp).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface NetworkPolicyTableProps {
  resources: any[];
}

export function NetworkPolicyTable({ resources }: NetworkPolicyTableProps) {
  const getPolicyTypesBadges = (policyTypes: string[]) => {
    return policyTypes.map((type) => (
      <Badge key={type} variant="outline" className="mr-1">
        {type}
      </Badge>
    ));
  };

  const formatSelector = (selector: any) => {
    if (!selector) return 'None';
    if (selector.matchLabels) {
      return Object.entries(selector.matchLabels)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
    }
    return 'Complex Selector';
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Policy Types</TableHead>
            <TableHead>Pod Selector</TableHead>
            <TableHead>Ingress Rules</TableHead>
            <TableHead>Egress Rules</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((policy) => {
            const policyTypes = policy.spec?.policyTypes || [];
            const podSelector = policy.spec?.podSelector;
            const ingressRules = policy.spec?.ingress?.length || 0;
            const egressRules = policy.spec?.egress?.length || 0;

            return (
              <TableRow key={`${policy.metadata.namespace}-${policy.metadata.name}`}>
                <TableCell>{policy.metadata.name}</TableCell>
                <TableCell>{policy.metadata.namespace}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {getPolicyTypesBadges(policyTypes)}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={formatSelector(podSelector)}>
                  {formatSelector(podSelector)}
                </TableCell>
                <TableCell>
                  <Badge variant={ingressRules > 0 ? "default" : "outline"}>
                    {ingressRules}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={egressRules > 0 ? "default" : "outline"}>
                    {egressRules}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(policy.metadata.creationTimestamp).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
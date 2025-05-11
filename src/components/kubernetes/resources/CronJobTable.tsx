import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CronJobTableProps {
  resources: any[];
}

export function CronJobTable({ resources }: CronJobTableProps) {
  const getStatusVariant = (active: boolean, lastScheduled: string | null) => {
    if (active) return "default";
    if (lastScheduled) return "secondary";
    return "outline";
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Namespace</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Suspend</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Last Schedule</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((cronjob) => {
            const activeJobs = cronjob.status?.active?.length || 0;
            const lastScheduleTime = cronjob.status?.lastScheduleTime;
            const suspended = cronjob.spec?.suspend || false;

            return (
              <TableRow key={`${cronjob.metadata.namespace}-${cronjob.metadata.name}`}>
                <TableCell>{cronjob.metadata.name}</TableCell>
                <TableCell>{cronjob.metadata.namespace}</TableCell>
                <TableCell>{cronjob.spec.schedule}</TableCell>
                <TableCell>
                  <Badge variant={suspended ? "destructive" : "default"}>
                    {suspended ? "Suspended" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(activeJobs > 0, lastScheduleTime)}>
                    {activeJobs}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lastScheduleTime ? new Date(lastScheduleTime).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell>{new Date(cronjob.metadata.creationTimestamp).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
} 
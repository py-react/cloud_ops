import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, Clock, ExternalLink, FileText, Terminal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from "@/libs/utils"
interface ResourceTableProps<T> {
  columns: { header: string; accessor: string }[];
  data: T[];
  onViewDetails?: (resource: T) => void;
  onViewLogs?: (resource: T) => void;
  onViewConfig?: (resource: T) => void;
  onDelete?: (resource: T) => void;
  className?:string
}

export function ResourceTable<T>({ 
  columns, 
  data, 
  onViewDetails,
  onViewLogs,
  onViewConfig,
  onDelete,
  className,
}: ResourceTableProps<T>) {

  const handleViewDetails = (resource: T) => {
    if (onViewDetails) onViewDetails(resource);
  };

  const handleViewLogs = (resource: T) => {
    if (onViewLogs) onViewLogs(resource);
  };

  const handleViewConfig = (resource: T) => {
    if (onViewConfig) onViewConfig(resource);
  };
  const handleDelete = (resource: T) => {
    if (onDelete) onDelete(resource);
  };


  return (
    <Card className={cn("shadow-none",className)}>
      <div className="rounded-[calc(0.5rem-2px)] border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessor}>{column.header}</TableHead>
              ))}
              {onViewDetails || onViewLogs || onViewConfig || onDelete ? (
                <TableHead>Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.accessor}>
                      {renderCellContent(column.accessor, column.accessor.split('.').reduce((obj, key) => obj && obj[key], row))}
                    </TableCell>
                  ))}
                  {onViewDetails || onViewLogs || onViewConfig || onDelete ?(
                  <TableCell>
                    <div className="flex items-center justify-start gap-2">
                      {!!onViewDetails ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(row)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Details</span>
                        </Button>
                      ) : null}
                      {!!onViewLogs ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(row)}
                        >
                          <Terminal className="h-4 w-4" />
                          <span className="sr-only">Logs</span>
                        </Button>
                      ) : null}
                      {!!onViewConfig ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewConfig(row)}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Config</span>
                        </Button>
                      ) : null}
                      {!!onDelete ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                  ):null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function renderCellContent(type: string, value: any) {
  if (type === 'status') {
    const statusMap = {
      running: { icon: CheckCircle2, color: 'text-green-500', label: 'Running' },
      pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
      failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
    };

    const status = statusMap[(value as string).toLowerCase()] || statusMap.pending;
    const Icon = status.icon;

    return (
      <div className="flex items-center gap-2 rounded-[0.5rem]">
        <Icon className={`h-4 w-4 ${status.color}`} />
        <span>{status.label}</span>
      </div>
    );
  }

  if (type === 'labels' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1 ">
        {value.map((label, i) => (
          <Badge key={i} variant="outline" className="text-xs rounded-[0.5rem]">
            {label}
          </Badge>
        ))}
      </div>
    );
  }

  return value;
}

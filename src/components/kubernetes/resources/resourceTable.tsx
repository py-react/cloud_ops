import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, Clock, ExternalLink, FileText, Terminal, Trash2, Play, EditIcon, PauseIcon, StopCircleIcon } from 'lucide-react';
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
  onPlay?: (resource: T) => void;
  onEdit?: (resource: T) => void;
  onStop?: (resource: T) => void;
  onPause?: (resource: T) => void;
  className?: string;
  tableClassName?: string;
}

export function ResourceTable<T>({
  columns,
  data,
  onViewDetails,
  onViewLogs,
  onViewConfig,
  onEdit,
  onDelete,
  onPlay,
  onStop,
  onPause,
  className,
  tableClassName,
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

  const handlePlay = (resource: T) => {
    if (onPlay) onPlay(resource);
  };

  const handleStop = (resource: T) => {
    if (onStop) onStop(resource);
  };

  const handlePause = (resource: T) => {
    if (onPause) onPause(resource);
  };

  const showActions = onViewDetails || onViewLogs || onViewConfig || onDelete || onPlay || onStop || onPause || onEdit

  return (
    <Card className={cn("shadow-none", className)}>
      <div className="rounded-[calc(0.5rem-2px)] border">
          <Table wrapperClassName={tableClassName}>
            <TableHeader className="bg-background z-10 border-b">
              <TableRow className='sticky top-0'>
                {columns.map((column) => (
                  <TableHead key={column.accessor} className="bg-background">{column.header}</TableHead>
                ))}
                {showActions ? (
                  <TableHead className="bg-background">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.accessor}>
                        {renderCellContent(column.accessor, column.accessor.split('.').reduce((obj: any, key: string) => obj && obj[key], row as Record<string,any>))}
                      </TableCell>
                    ))}
                    {showActions ? (
                      <TableCell>
                        <div className="flex items-center justify-start gap-2">
                          {!!onPlay ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlay(row)}
                            >
                              <Play className="h-4 w-4 text-green-500" />
                              <span className="sr-only">Play</span>
                            </Button>
                          ) : null}
                          {!!onStop ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStop(row)}
                            >
                              <StopCircleIcon className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Stop</span>
                            </Button>
                          ) : null}
                          {!!onPause ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePause(row)}
                            >
                              <PauseIcon className="h-4 w-4 text-yellow-600" />
                              <span className="sr-only">Pause</span>
                            </Button>
                          ) : null}
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
                          {!!onEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                            >
                              <EditIcon className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
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
                    ) : null}
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

    const status = statusMap[(value as string).toLowerCase() as keyof typeof statusMap] || statusMap.pending;
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

  if (typeof value === "object" && !("props" in value)) {
    return JSON.stringify(value)
  }
  return value;
}

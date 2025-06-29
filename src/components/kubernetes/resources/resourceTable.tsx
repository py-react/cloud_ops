import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Clock, ExternalLink, FileText, Terminal, Trash2, Play, EditIcon, PauseIcon, StopCircleIcon, X, Skull, RotateCcw, CircleCheck, HelpCircle, Copy, Undo2, MoreHorizontal, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from "@/libs/utils"

type ResourceTableActionProps = {
  showPlay?: boolean;
  showStop?: boolean;
  showPause?: boolean;
  showViewDetails?: boolean;
  showViewLogs?: boolean;
  showViewConfig?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showClone?: boolean;
  showUndo?: boolean;
};

interface ResourceTableProps<T> {
  columns: { header: string; accessor: string }[];
  data: (T & ResourceTableActionProps)[];
  onViewDetails?: (resource: T) => void;
  onViewLogs?: (resource: T) => void;
  onViewConfig?: (resource: T) => void;
  onDelete?: (resource: T) => void;
  onPlay?: (resource: T) => void;
  onEdit?: (resource: T) => void;
  onStop?: (resource: T) => void;
  onPause?: (resource: T) => void;
  onClone?: (resource: T) => void;
  onUndo?: (resource: T) => void;
  className?: string;
  tableClassName?: string;
}

// Default all ResourceTableActionProps to true if not provided
function withDefaultActionProps<T>(row: T & ResourceTableActionProps): T & Required<ResourceTableActionProps> {
  return {
    showPlay: row.showPlay !== undefined ? row.showPlay : true,
    showStop: row.showStop !== undefined ? row.showStop : true,
    showPause: row.showPause !== undefined ? row.showPause : true,
    showViewDetails: row.showViewDetails !== undefined ? row.showViewDetails : true,
    showViewLogs: row.showViewLogs !== undefined ? row.showViewLogs : true,
    showViewConfig: row.showViewConfig !== undefined ? row.showViewConfig : true,
    showEdit: row.showEdit !== undefined ? row.showEdit : true,
    showDelete: row.showDelete !== undefined ? row.showDelete : true,
    showClone: row.showClone !== undefined ? row.showClone : true,
    showUndo: row.showClone !== undefined ? row.showClone : true,
    ...row,
  };
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
  onClone,
  onUndo,
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
  const handleClone = (resource: T) => {
    if (onClone) onClone(resource);
  };
  const handleUndo = (resource: T) => {
    if (onUndo) onUndo(resource);
  };

  const showActions = onViewDetails || onViewLogs || onViewConfig || onDelete || onPlay || onStop || onPause || onEdit || onUndo || onClone

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
                data.map((row, index) => {
                  const rowWithDefaults = withDefaultActionProps(row);
                  return (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.accessor}>
                        {renderCellContent(column.accessor, column.accessor.split('.').reduce((obj: any, key: string) => obj && obj[key], row as Record<string,any>))}
                      </TableCell>
                    ))}
                    {showActions ? (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onPlay && rowWithDefaults.showPlay && (
                              <DropdownMenuItem onSelect={() => handlePlay(row)}>
                                <Play className="h-4 w-4 text-green-500 mr-2" />
                                Play
                              </DropdownMenuItem>
                            )}
                            {onStop && rowWithDefaults.showStop && (
                              <DropdownMenuItem onSelect={() => handleStop(row)}>
                                <StopCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                Stop
                              </DropdownMenuItem>
                            )}
                            {onPause && rowWithDefaults.showPause && (
                              <DropdownMenuItem onSelect={() => handlePause(row)}>
                                <PauseIcon className="h-4 w-4 text-yellow-600 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {onViewDetails && rowWithDefaults.showViewDetails && (
                              <DropdownMenuItem onSelect={() => handleViewDetails(row)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onViewLogs && rowWithDefaults.showViewLogs && (
                              <DropdownMenuItem onSelect={() => handleViewLogs(row)}>
                                <Terminal className="h-4 w-4 mr-2" />
                                View Logs
                              </DropdownMenuItem>
                            )}
                            {onViewConfig && rowWithDefaults.showViewConfig && (
                              <DropdownMenuItem onSelect={() => handleViewConfig(row)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Config
                              </DropdownMenuItem>
                            )}
                            {onEdit && rowWithDefaults.showEdit && (
                              <DropdownMenuItem onSelect={() => onEdit(row)}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onClone && rowWithDefaults.showClone && (
                              <DropdownMenuItem onSelect={() => handleClone(row)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Clone
                              </DropdownMenuItem>
                            )}
                            {onUndo && rowWithDefaults.showUndo && (
                              <DropdownMenuItem onSelect={() => handleUndo(row)}>
                                <Undo2 className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            {onDelete && rowWithDefaults.showDelete && (
                              <DropdownMenuItem 
                                onSelect={() => handleDelete(row)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )})
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
  if(typeof value === "object" && ("props" in value)) {
    return value
  }
  if (type === 'status') {
    const statusMap = {
      running: { icon: CheckCircle, color: 'text-green-500', label: 'Running' },
      pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
      failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
    };
    const statusMap2 = {
      active: { icon: CheckCircle, color: 'text-green-500', label: 'Active' },
      inactive: { icon: Clock, color: 'text-yellow-500', label: 'Inactive' },
      deleted: { icon: AlertTriangle, color: 'text-red-500', label: 'Deleted' },
    };

    const status =
      statusMap[(value as string).toLowerCase() as keyof typeof statusMap] ||
      statusMap2[(value as string).toLowerCase() as keyof typeof statusMap2] ||
      statusMap.pending;
    const Icon = status.icon;

    return (
      <div className="flex items-center gap-2 rounded-[0.5rem]">
        <Icon className={`h-4 w-4 ${status.color}`} />
        <span>{status.label}</span>
      </div>
    );
  }

  if (type === 'podStatus') {
    const statusMap = {
      running:            { icon: CheckCircle,   color: 'text-green-500',  label: 'Running' },
      pending:            { icon: Clock,          color: 'text-yellow-500', label: 'Pending' },
      succeeded:          { icon: CircleCheck,    color: 'text-blue-500',   label: 'Succeeded' },
      failed:             { icon: X,        color: 'text-red-500',    label: 'Failed' },
      crashloopbackoff:   { icon: AlertTriangle,  color: 'text-orange-500', label: 'CrashLoopBackOff' },
      unknown:            { icon: HelpCircle,     color: 'text-gray-500',   label: 'Unknown' },
    };
  
    const key = (value as string).toLowerCase();
    const status = statusMap[key as keyof typeof statusMap] || statusMap.unknown;
    const Icon = status.icon;
  
    return (
      <div className="flex items-center gap-2 rounded-[0.5rem]">
        <Icon className={`h-4 w-4 ${status.color}`} />
        <span>{status.label}</span>
      </div>
    );
  }

  if (type === 'containerStatus') {
    const statusMap = {
      created:       { icon: CheckCircle, color: 'text-blue-400', label: 'Created' },
      restarting:    { icon: RotateCcw,   color: 'text-yellow-500', label: 'Restarting' },
      running:       { icon: CheckCircle, color: 'text-green-500', label: 'Running' },
      removing:      { icon: Trash2,      color: 'text-gray-500', label: 'Removing' },
      paused:        { icon: PauseIcon, color: 'text-yellow-400', label: 'Paused' },
      exited:        { icon: X,     color: 'text-red-500', label: 'Exited' },
      dead:          { icon: Skull,       color: 'text-red-700', label: 'Dead' },
    };
  
    const status = statusMap[(value as string)?.toLowerCase() as keyof typeof statusMap] || statusMap.exited;
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

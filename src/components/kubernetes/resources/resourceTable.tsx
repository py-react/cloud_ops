import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Clock, ExternalLink, FileText, Terminal, Trash2, Play, EditIcon, PauseIcon, StopCircleIcon, X, Skull, RotateCcw, CircleCheck, HelpCircle, Copy, Undo2, MoreHorizontal, MoreVertical, ArrowDownToLineIcon, Ban, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  showPush?: boolean;
};

interface ResourceTableProps<T> {
  columns: { header: string; accessor: string; cell?: (row: T) => React.ReactNode }[];
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
  onPush?: (resource: T) => void;
  onBulkPlay?: (resources: T[]) => void;
  onBulkStop?: (resources: T[]) => void;
  onBulkPause?: (resources: T[]) => void;
  onBulkDelete?: (resources: T[]) => void;
  className?: string;
  tableClassName?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
  loading?: boolean;
  highlightedId?: string | number | null;
  onRowClick?: (row: T) => void;
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
    showUndo: row.showUndo !== undefined ? row.showUndo : true,
    showPush: row.showPush !== undefined ? row.showPush : true,
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
  onPush,
  onBulkPlay,
  onBulkPause,
  onBulkStop,
  onBulkDelete,
  className,
  tableClassName,
  title,
  description,
  icon,
  extraHeaderContent,
  loading,
  highlightedId,
  onRowClick,
}: ResourceTableProps<T>) {

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((_, i) => i)));
    }
  };

  const toggleRow = (index: number) => {
    const next = new Set(selectedIds);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIds(next);
  };

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
  const handlePush = (resource: T) => {
    if (onPush) onPush(resource);
  };

  const showActions = onViewDetails || onViewLogs || onViewConfig || onDelete || onPlay || onStop || onPause || onEdit || onUndo || onClone

  return (
    <Card className={cn("relative p-0 py-2 overflow-hidden border-none bg-transparent shadow-none", className)}>
      {/* Floating Action Bar - Standardized to Bottom Center */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 animate-in fade-in slide-in-from-bottom-10  duration-500">
          <div className="flex items-center gap-6 p-4 bg-background/60 backdrop-blur-2xl border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-3 border-r border-border/50 pr-6 mr-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 leading-none mb-1">Selected</span>
                <span className="text-2xl font-black text-foreground tabular-nums leading-none tracking-tight">{selectedIds.size}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onBulkPlay && (
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => onBulkPlay(Array.from(selectedIds).map(idx => data[idx]))}
                  title="Start Selected"
                >
                  <Play className="w-5 h-5" />
                </Button>
              )}
              {onBulkPause && (
                <Button
                  variant="subtle"
                  size="icon"
                  className="hover:bg-amber-500/10 hover:text-amber-500"
                  onClick={() => onBulkPause(Array.from(selectedIds).map(idx => data[idx]))}
                  title="Pause Selected"
                >
                  <PauseIcon className="w-5 h-5" />
                </Button>
              )}
              {onBulkStop && (
                <Button
                  variant="subtle"
                  size="icon"
                  className="hover:bg-orange-500/10 hover:text-orange-500"
                  onClick={() => onBulkStop(Array.from(selectedIds).map(idx => data[idx]))}
                  title="Stop Selected"
                >
                  <StopCircleIcon className="w-5 h-5" />
                </Button>
              )}


              {onBulkDelete && (
                <>
                  <div className="w-px h-8 bg-border/50 mx-2" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="shadow-lg"
                    onClick={() => onBulkDelete(Array.from(selectedIds).map(idx => data[idx]))}
                    title="Delete Selected"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            <div className="border-l border-border/50 pl-2">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedIds(new Set())}
                title="Clear Selection"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        {title && (
          <div className="flex-none p-6 border-b border-border/30 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
                {description && (
                  <p className="text-[13px] font-medium text-muted-foreground mt-0.5 whitespace-normal">
                    {description}
                  </p>
                )}
              </div>
              {extraHeaderContent && (
                <div className="flex-none">
                  {extraHeaderContent}
                </div>
              )}
            </div>
          </div>
        )}
        <Table wrapperClassName={tableClassName}>
          <TableHeader className="z-10 bg-background/50 backdrop-blur-md border-b border-border/30">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[50px] px-0 pl-1">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedIds.size === data.length && data.length > 0}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </div>
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.accessor} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">{column.header}</TableHead>
              ))}
              {showActions ? (
                <TableHead className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center w-[100px]">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/20">
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + 2}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading resources...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((row, index) => {
                const rowWithDefaults = withDefaultActionProps(row);
                const isSelected = selectedIds.has(index);
                const isHighlighted = highlightedId !== undefined && highlightedId !== null && (row as any).id == highlightedId;

                return (
                  <TableRow
                    className={cn(
                      'group transition-all duration-300 animate-slide-in-up border-border/20',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                      isHighlighted && 'animate-row-highlight'
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    key={index}
                  >
                    <TableCell className="px-0 pl-1">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(index)}
                          aria-label={`Select row ${index}`}
                        />
                      </div>
                    </TableCell>
                    {columns.map((column) => {
                      const value = column.accessor.split('.').reduce((obj: any, key: string) => obj && obj[key], row as Record<string, any>);
                      return (
                        <TableCell className='px-4 py-3' key={column.accessor}>
                          <div className="transition-transform duration-300 group-hover:translate-x-0.5">
                            {column.cell ? column.cell(row) : renderCellContent(column.accessor, value)}
                          </div>
                        </TableCell>
                      );
                    })}
                    {showActions ? (
                      <TableCell className='px-4 py-1 text-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-background/80 backdrop-blur-xl border-border/50">
                            {onPlay && rowWithDefaults.showPlay && (
                              <DropdownMenuItem onSelect={() => handlePlay(row)} className="gap-2 text-sm">
                                <Play className="h-4 w-4 text-emerald-500" />
                                Start
                              </DropdownMenuItem>
                            )}
                            {onPause && rowWithDefaults.showPause && (
                              <DropdownMenuItem onSelect={() => handlePause(row)} className="gap-2 text-sm">
                                <PauseIcon className="h-4 w-4 text-amber-500" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {onStop && rowWithDefaults.showStop && (
                              <DropdownMenuItem onSelect={() => handleStop(row)} className="gap-2 text-sm">
                                <StopCircleIcon className="h-4 w-4 text-orange-500" />
                                Stop
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-border/50 my-1" />
                            {onViewDetails && rowWithDefaults.showViewDetails && (
                              <DropdownMenuItem onSelect={() => handleViewDetails(row)} className="gap-2 text-sm">
                                <ExternalLink className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onViewLogs && rowWithDefaults.showViewLogs && (
                              <DropdownMenuItem onSelect={() => handleViewLogs(row)} className="gap-2 text-sm">
                                <Terminal className="h-4 w-4" />
                                View Logs
                              </DropdownMenuItem>
                            )}
                            {onEdit && rowWithDefaults.showEdit && (
                              <DropdownMenuItem onSelect={() => onEdit(row)} className="gap-2 text-sm">
                                <EditIcon className="h-4 w-4" />
                                Edit Config
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-border/50 my-1" />
                            {onDelete && rowWithDefaults.showDelete && (
                              <DropdownMenuItem
                                onSelect={() => handleDelete(row)}
                                className="text-destructive focus:text-destructive gap-2 text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + 2}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card >
  );
}

function renderCellContent(type: string, value: any) {
  if (typeof value === "object" && ("props" in value)) {
    return value
  }

  if (type === 'status') {
    const val = String(value).toLowerCase();
    if (val === 'running' || val === 'active' || val === 'online') {
      return <Badge variant="success" className="gap-1.5 text-xs"><div className="w-1 h-1 rounded-full bg-current animate-pulse" /> {value}</Badge>
    }
    if (val === 'pending' || val === 'inactive' || val === 'stopped') {
      return <Badge variant="warning" className="text-xs">{value}</Badge>
    }
    if (val === 'failed' || val === 'deleted' || val === 'error') {
      return <Badge variant="destructive" className="text-xs">{value}</Badge>
    }
    return <Badge variant="outline" className="text-xs">{value}</Badge>
  }

  if (type === 'podStatus' || type === 'containerStatus') {
    const val = String(value).toLowerCase();
    const statusMap: Record<string, { variant: "success" | "warning" | "destructive" | "info" | "glow" | "outline", icon: any }> = {
      running: { variant: "success", icon: CheckCircle },
      active: { variant: "success", icon: CheckCircle },
      completed: { variant: "success", icon: CircleCheck },
      succeeded: { variant: "success", icon: CircleCheck },

      pending: { variant: "warning", icon: Clock },
      restarting: { variant: "warning", icon: RotateCcw },
      paused: { variant: "warning", icon: PauseIcon },
      created: { variant: "info", icon: CheckCircle },

      failed: { variant: "destructive", icon: X },
      error: { variant: "destructive", icon: AlertTriangle },
      dead: { variant: "destructive", icon: Skull },
      exited: { variant: "destructive", icon: Ban },
      crashloopbackoff: { variant: "destructive", icon: AlertTriangle },
    };

    const status = statusMap[val] || { variant: "outline", icon: HelpCircle };
    const Icon = status.icon;

    return (
      <Badge variant={status.variant} className="gap-1.5 py-0.5 text-xs">
        <Icon className="h-3.5 w-3.5" />
        <span>{value}</span>
      </Badge>
    );
  }

  if (type === 'labels' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((label, i) => (
          <Badge key={i} variant="outline" className="text-[11px] font-normal px-2 py-0 border-border/30">
            {label}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === "object" && !("props" in value)) {
    return <code className="text-xs bg-muted px-1.5 rounded">{JSON.stringify(value)}</code>
  }

  return <span className="text-sm font-medium text-foreground/80">{value}</span>;
}


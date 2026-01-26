import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  accessor: string;
  header: string;
  type?: 'text' | 'boolean' | 'badge';
  badgeVariant?: (value: any) => string;
}

interface EnhancedResourceTableProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  columns: Column[];
  data: any[];
  loading?: boolean;
  multiSelect?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (id: string, selected: boolean) => void;
  onRowAction?: (action: string, row: any) => void;
}

export function EnhancedResourceTable({
  title,
  description,
  icon,
  columns,
  data,
  loading = false,
  multiSelect = false,
  selectedRows = [],
  onSelectionChange,
  onRowAction,
}: EnhancedResourceTableProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (onSelectionChange) {
      data.forEach(row => {
        onSelectionChange(String(row.id || row.name), checked);
      });
    }
  };

  const handleRowSelect = (rowId: string, checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(rowId, checked);
    }
  };

  const getRowId = (row: any) => String(row.id || row.name);

  const renderCellValue = (row: any, column: Column) => {
    const value = row[column.accessor];
    
    if (column.type === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (column.type === 'badge' && column.badgeVariant) {
      return (
        <Badge variant={column.badgeVariant(value)}>
          {value}
        </Badge>
      );
    }
    
    if (column.accessor === 'merge_strategy') {
      const colors: Record<string, string> = {
        'deep': 'default',
        'shallow': 'secondary', 
        'override': 'destructive',
        'append': 'outline'
      };
      return (
        <Badge variant={colors[value] || 'outline'}>
          {value}
        </Badge>
      );
    }
    
    return value || '—';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              {multiSelect && <Skeleton className="h-4 w-4" />}
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <Badge variant="outline">{data.length}</Badge>
        </div>
        
        {multiSelect && selectedRows.length > 0 && (
          <Badge variant="secondary">
            {selectedRows.length} selected
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">{description}</p>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {multiSelect && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.accessor}>{column.header}</TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (multiSelect ? 2 : 1)} className="text-center py-8">
                  <div className="text-muted-foreground">
                    No data available
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.includes(rowId);
                
                return (
                  <TableRow key={rowId} className={isSelected ? 'bg-muted/50' : ''}>
                    {multiSelect && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleRowSelect(rowId, checked as boolean)}
                          aria-label={`Select ${row.name || rowId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.accessor}>
                        {renderCellValue(row, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onRowAction?.('edit', row)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRowAction?.('duplicate', row)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRowAction?.('delete', row)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
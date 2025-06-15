import React from 'react';
import { StorageInfo } from '@/types/storage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface StorageCardProps {
  storage: StorageInfo;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (data: any) => void;
}

export const StorageCard: React.FC<StorageCardProps> = ({ storage, onDelete, onEdit }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {storage.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          {storage.inUse && (
            <Badge variant="outline" className="bg-green-50">
              In Use
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit({ storage })}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(storage.name)}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>Driver:</span>
            <span>{storage.driver}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Mountpoint:</span>
            <span className="truncate max-w-[200px]">{storage.mountPoint}</span>
          </div>
          <div className="flex justify-between">
            <span>Scope:</span>
            <span>{storage.scope}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

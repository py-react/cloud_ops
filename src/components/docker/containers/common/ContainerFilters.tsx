import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContainerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ContainerFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ContainerFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 px-0">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card/10 border-border/50 h-8 text-[12px]"
          placeholder="Search containers..."
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px] bg-card/10 border-border/50 h-8 text-[12px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-background/80 backdrop-blur-xl border-border/50 text-[12px]">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="exited">Exited</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="restarting">Restarting</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
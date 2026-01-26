import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, hasNext, hasPrevious, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        variant="outline"
        className="gap-2 rounded-xl font-bold border-border/40 hover:bg-muted/50 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Page</span>
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold ring-1 ring-primary/20">
          {currentPage}
        </span>
      </div>

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        variant="outline"
        className="gap-2 rounded-xl font-bold border-border/40 hover:bg-muted/50 disabled:opacity-50"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
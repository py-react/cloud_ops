import React, { useState } from 'react';
import { LayoutGrid, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageList } from '@/components/hubRegistry/ImageList';
import { SearchBar } from '@/components/hubRegistry/SearchBar';
import PageLayout from '@/components/PageLayout';
import { useDockerImages } from '@/components/hubRegistry/hooks/useDockerImages';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ContainerListPage = () => {
  const {
    images,
    loading,
    error,
    currentPage,
    hasNext,
    hasPrevious,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
  } = useDockerImages();

  return (
    <PageLayout
      title="Hub Images"
      subtitle="Explore millions of container images. Browse official releases and pull directly to your registry."
      icon={LayoutGrid}
      actions={
        <div className="flex items-center gap-4 mb-1">
          <div className="w-full md:w-[400px] shrink-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-2 border-l border-border/50 pl-4">
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrevious || loading}
              onClick={() => setCurrentPage(p => p - 1)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold tabular-nums w-8 text-center text-muted-foreground">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext || loading}
              onClick={() => setCurrentPage(p => p + 1)}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex-1 mt-4 overflow-y-auto pr-1">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Failed to load images</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-background border border-border/40 rounded-xl overflow-hidden animate-pulse">
                <div className="flex items-stretch gap-0">
                  <div className="w-40 bg-muted/30 p-8 shrink-0 border-r border-border/10 h-40" />
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ImageList images={images} />
        )
        }
      </div>
    </PageLayout>
  );
};

export default ContainerListPage;

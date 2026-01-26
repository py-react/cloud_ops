import React from "react";
import { ErrorMessage } from '@/components/hubRegistry/ErrorMessage';
import { useDockerImages } from '@/components/hubRegistry/hooks/useDockerImages';
import { ImageList } from '@/components/hubRegistry/ImageList';
import { Pagination } from '@/components/hubRegistry/pagination';
import { SearchBar } from '@/components/hubRegistry/SearchBar';
import { Loader2, LayoutGrid } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

function ContainerListPage({ }) {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div key="hub" className="w-full h-[calc(100vh-4rem)] flex flex-col animate-in fade-in overflow-hidden pr-1">
      {/* Main Header & Search */}
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2.5 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest leading-none">Hub Images</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl mt-2 px-1">
                Explore millions of container images. Browse official releases and pull directly to your registry.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[400px] shrink-0 mb-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 pt-2 relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary/60 outline-none" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">Fetching global registry data...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-1">
              <div className="p-0 space-y-8 pb-10">
                <ImageList images={images} />
              </div>
            </ScrollArea>

            {/* Sticky Footer for Pagination */}
            <div className="flex-none py-1.5 px-6 border-t border-border/40 bg-background/95 backdrop-blur-xl z-10">
              <Pagination
                currentPage={currentPage}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ContainerListPage;

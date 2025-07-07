import React from "react";
import { ErrorMessage } from '@/components/hubRegistry/ErrorMessage';
import { useDockerImages } from '@/components/hubRegistry/hooks/useDockerImages';
import { ImageList } from '@/components/hubRegistry/ImageList';
import { Pagination } from '@/components/hubRegistry/pagination';
import { SearchBar } from '@/components/hubRegistry/SearchBar';
import { Loader2 } from 'lucide-react';

function ContainerListPage({}) {
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
    <div key="hub" className="w-full">
        <div className="mb-2 h-4"></div>
        <div className="container mx-auto p-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Hub Images</h1>
            
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            
            {loading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            </div>
            ) : (
            <>
                <ImageList images={images} />
                
                <Pagination
                currentPage={currentPage}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onPageChange={handlePageChange}
                />
            </>
            )}
        </div>
    </div>
  );
}

export default ContainerListPage;

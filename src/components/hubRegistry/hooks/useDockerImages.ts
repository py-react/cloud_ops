import { useState, useEffect } from 'react';
import { DockerHubResponse, DockerImage } from '../types';

export function useDockerImages() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = searchQuery
          ? `/api/docker/hub/api/search/v3/catalog/search?query=${encodeURIComponent(searchQuery)}&from=${currentPage===1?0:(currentPage-1)*10}&size=10&open_source=true&source=store`
          : `/api/docker/hub/api/search/v3/catalog/search?from=${currentPage===1?0:(currentPage-1)*10}&size=10&open_source=true&source=store`;
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data: DockerHubResponse = await response.json();
        setImages(data.results);
        setHasNext((currentPage-1)*10 < data.total);
        setHasPrevious(currentPage!=1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchImages, 300);
    return () => clearTimeout(debounceTimeout);
  }, [currentPage, searchQuery]);

  return {
    images,
    loading,
    error,
    currentPage,
    hasNext,
    hasPrevious,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
  };
}
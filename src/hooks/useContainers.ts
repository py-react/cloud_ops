import { useState, useEffect } from 'react';
import { ContainerInfo, DefaultService } from '@/gingerJs_api_client';

export function useContainers() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const response = await DefaultService.apiContainersGet();
      setContainers(response.containers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch containers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  return {
    containers,
    setContainers,
    loading,
    error,
    refetch: fetchContainers
  };
} 
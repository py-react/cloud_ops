import { useState, useEffect } from 'react';
import { DefaultService } from '@/gingerJs_api_client';

export function useContainerStats(containerId: string | null) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!containerId) return;
    
    try {
      setLoading(true);
      const response = await DefaultService.apiContainersStatsContainerIdGet({ containerId });
      setStats(response.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch container stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerId) {
      fetchStats();
    }
  }, [containerId]);

  return {
    stats,
    loading,
    error,
    refetchStats: fetchStats
  };
} 
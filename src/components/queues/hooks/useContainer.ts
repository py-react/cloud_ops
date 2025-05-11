import { useState, useEffect } from 'react';
import type { Container, RunContainerPayload } from '../types/container';
import * as api from '../services/api';

export function useContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchQueues();
      setContainers(data.containers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch containers');
    } finally {
      setLoading(false);
    }
  };

  const startContainer = async (payload: RunContainerPayload) => {
    try {
      await api.startQueue(payload);
      await fetchContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start container');
    }
  };

  const removeContainer = async (containerId: string) => {
    try {
      await api.removeQueue(containerId);
      await fetchContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop container');
    }
  };

  useEffect(() => {
    fetchContainers();
    // const interval = setInterval(fetchContainers, 5000);
    // return () => clearInterval(interval);
  }, []);

  return { containers, loading, error, startContainer, removeContainer };
}
import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import SystemInfo from "@/components/docker/systemOverview/Overview";
import { DefaultService } from "@/gingerJs_api_client";
import { Button } from "@/components/ui/button";

const ContainerListPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(true);

  const fetchGranularData = async (action: string, stateKey?: string) => {
    const key = stateKey || action;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const response = await DefaultService.apiDockerSystemsPost({
        requestBody: { action }
      }) as any;

      if (!response.error && response.data) {
        setSystemInfo(prev => {
          // Deep merge or specific mapping
          // The API returns pieces like { ID: ... } or { Containers: ... }
          // We need to merge them into the flat 'systemInfo' structure expected by <SystemInfo />

          // Special handling for nested stats structure if consistent with previous SystemInfo component
          if (action === "network_io") {
            return {
              ...prev,
              system_stats: {
                ...prev.system_stats,
                network: response.data
              }
            };
          }
          if (action === "memory_usage") {
            return {
              ...prev,
              system_stats: {
                ...prev.system_stats,
                memory: response.data
              }
            };
          }

          // For flat data (general, resources, etc.)
          return { ...prev, ...response.data };
        });
      }
    } catch (error) {
      console.error(`Failed to fetch ${action}`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const refreshAll = useCallback(async () => {
    setIsGlobalRefreshing(true);

    // Define all the granular fetches
    // We run the fast ones in parallel
    const fastActions = [
      "general",
      "resources",
      "containers",
      "images",
      "network_config",
      "security",
      "drivers",
      "plugins"
    ];

    const heavyActions = [
      "network_io",
      "memory_usage"
    ];

    // Trigger fast actions
    const fastPromises = fastActions.map(action => fetchGranularData(action));

    // Trigger heavy actions
    const heavyPromises = heavyActions.map(action => fetchGranularData(action));

    await Promise.all([...fastPromises, ...heavyPromises]);
    setIsGlobalRefreshing(false);
  }, []);

  // Initial Fetch on Mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Check if any critical data is loading
  const isLoading = Object.values(loadingStates).some(state => state);

  return (
    <SystemInfo
      systemInfo={systemInfo}
      loadingStates={loadingStates}
      onRefresh={refreshAll}
      isRefreshing={isLoading || isGlobalRefreshing}
    />
  );
};

export default ContainerListPage;

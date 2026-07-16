import React, { createContext, useEffect, useState, useCallback, useMemo } from "react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

interface IDockerEngine {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
  is_default: boolean;
}

interface IDockerEngineContext {
  engines: IDockerEngine[];
  isLoading: boolean;
  activeEngineId: number | null;
  activeEngineName: string;
  setActiveEngineId: (id: number) => Promise<void>;
  refreshEngines: () => Promise<void>;
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
}

export const DockerEngineContext = createContext<IDockerEngineContext>({
  engines: [],
  isLoading: false,
  activeEngineId: null,
  activeEngineName: "Local Engine",
  setActiveEngineId: async () => {},
  refreshEngines: async () => {},
  globalError: null,
  setGlobalError: () => {},
});

export const DockerEngineContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [engines, setEngines] = useState<IDockerEngine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEngineId, setActiveEngineId] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const refreshEngines = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DefaultService.apiSettingsDockerConfigGet() as IDockerEngine[];
      setEngines(data || []);
      const active = data?.find((e: any) => e.is_active);
      if (active) {
        setActiveEngineId(active.id);
      } else if (data && data.length > 0) {
        setActiveEngineId(data[0].id);
      } else {
        setActiveEngineId(0); // fallback to local engine
      }
    } catch (error) {
      console.error("Failed to fetch Docker configurations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEngines();
  }, [refreshEngines]);

  const activeEngineName = useMemo(() => {
    const active = engines.find(e => e.id === activeEngineId);
    return active ? active.name : "Local Engine";
  }, [engines, activeEngineId]);

  const handleSwitchActiveEngineId = async (id: number) => {
    try {
      const targetId = id === 0 ? 0 : id;
      const targetEngine = engines.find(e => e.id === id);
      await DefaultService.apiSettingsDockerConfigPatch({ 
        id: targetId, 
        requestBody: { is_active: true } 
      });
      setActiveEngineId(id);
      toast.success(`Switched context to ${targetEngine?.name || 'Engine'}`);
      
      // Update local engines state as well so active engine is correct
      setEngines(prev => prev.map(e => ({
        ...e,
        is_active: e.id === id
      })));
    } catch (error) {
      toast.error("Failed to switch engine context");
    }
  };

  return (
    <DockerEngineContext.Provider
      value={{
        engines,
        isLoading,
        activeEngineId,
        activeEngineName,
        setActiveEngineId: handleSwitchActiveEngineId,
        refreshEngines,
        globalError,
        setGlobalError,
      }}
    >
      {children}
    </DockerEngineContext.Provider>
  );
};

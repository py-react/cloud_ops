import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { DefaultService } from "@/gingerJs_api_client";
import { KubernetesContext } from "@/components/kubernetes/types";

type KubeConfig = {
  contexts: {
    name: string;
    context: {
      cluster: string;
      user: string;
      namespace?: string;
    };
  }[];
  clusters: {
    name: string;
    cluster: {
      server: string;
    };
  }[];
  users: {
    name: string;
    user: any;
  }[];
  "current-context": string;
};

type TransformedContext = {
  name: string;
  clusterName: string;
  clusterServer: string;
  userName: string;
  namespace: string;
  current: boolean;
};

function transformKubeConfigToMockContexts(
  kubeConfig: KubeConfig
): TransformedContext[] {
  if (!Object.keys(kubeConfig).length) return [];
  const {
    contexts,
    clusters,
    ["current-context"]: currentContextName,
  } = kubeConfig;

  const clusterMap = Object.fromEntries(
    clusters.map(({ name, cluster }) => [name, cluster])
  );

  return contexts.map(({ name, context }) => {
    const clusterInfo = clusterMap[context.cluster] || {};
    return {
      name,
      clusterName: context.cluster,
      clusterServer: clusterInfo.server || "",
      userName: context.user,
      namespace: context.namespace || "default",
      current: name === currentContextName,
    };
  });
}

interface KubeContextType {
  config: any;
  isLoading: boolean;
  fetchconfig: () => Promise<void>;
  setCurrentKubeContext: (newContext: KubernetesContext) => Promise<void>;
  currentKubeContext?: KubernetesContext;
  updateConfig?:React.Dispatch<React.SetStateAction<KubeConfig>>
}

interface KubeContextProviderProps {
  children: React.ReactNode;
}

export const KubeContext = createContext<KubeContextType>(
  {} as KubeContextType
);

export const useKubeContext = () => {
  const context = useContext(KubeContext);
  if (!context) {
    throw new Error("useKubeContext must be used within a KubeContextProvider");
  }
  return context;
};

export const KubeContextProvider = ({ children }: KubeContextProviderProps) => {
  const [config, setConfig] = useState<KubeConfig>({} as KubeConfig);
  const [transformedConfig, setTransformedConfig] = useState<
    TransformedContext[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentKubeContext, setCurrentKubeContext] =
    useState<KubernetesContext>();

  const fetchconfig = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiKubernertesContextGet({
        action: "all",
      });
      setConfig(response as KubeConfig);
    } catch (err) {
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextChange = async (newContext: KubernetesContext) => {
    try {
      await DefaultService.apiKubernertesContextPost({
        requestBody: { type: "switch", payload: { switch: newContext.name } },
      });
      setCurrentKubeContext(newContext);
      toast.info(`Switched to context: ${newContext.name}`);
    } catch (err) {
      toast.info(
        `Error while switching to context "${newContext.name}": ${err}`
      );
    }
  };

  useEffect(() => {
    if (!!Object.keys(config).length) {
      const transformedData = transformKubeConfigToMockContexts(config);
      setTransformedConfig(transformedData);
      const currentContext = transformedData.filter((i) => i.current);
      if (currentContext.length) {
        setCurrentKubeContext({
          context: {
            cluster: currentContext[0].clusterName,
            user: currentContext[0].userName,
            namespace: currentContext[0].namespace
          },
          name: currentContext[0].name,
        });
      }
      return;
    }
    fetchconfig();
  }, [config]);

  return (
    <KubeContext.Provider
      value={{
        config: transformedConfig,
        isLoading,
        fetchconfig,
        setCurrentKubeContext: handleContextChange,
        currentKubeContext,
        updateConfig:setConfig
      }}
    >
      {children}
    </KubeContext.Provider>
  );
};

import { DefaultService } from "@/gingerJs_api_client";
import React, { createContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface INamespaceContext {
  namespaces: { name: string }[];
  isLoading: boolean;
  fetchNamespaces: () => void;
  setSelectedNamespace: React.Dispatch<React.SetStateAction<string>>;
  selectedNamespace: string;
  error: string;
}

export const NamespaceContext = createContext<INamespaceContext>({
  namespaces: [],
  isLoading: false,
  fetchNamespaces: () => {},
  setSelectedNamespace: () => {},
  selectedNamespace: "",
  error: "",
});

export const NamespaceContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [namespaces, setNamespaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");

  const fetchNamespaces = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiKubernertesClusterNamespaceGet();
      if ((response as any).status !== "error") {
        setNamespaces((response as any).data as []);
      } else {
        throw (response as any).message;
      }
    } catch (err) {
      setError("Failed to fetch services");
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (namespaces.length) return;
    if (!error) {
      fetchNamespaces();
      return;
    }
    const timeout = setTimeout(() => {
      fetchNamespaces();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [namespaces, error]);

  return (
    <NamespaceContext.Provider
      value={{
        namespaces,
        isLoading,
        fetchNamespaces,
        setSelectedNamespace,
        selectedNamespace,
        error,
      }}
    >
      {children}
    </NamespaceContext.Provider>
  );
};

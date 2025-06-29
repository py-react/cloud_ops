import { DefaultService } from "@/gingerJs_api_client";
import useNavigate from "@/libs/navigate";
import React, { createContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  const navigate = useNavigate()
  const {namespace} = useParams()
  const [namespaces, setNamespaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace || "default");

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
        setSelectedNamespace:(namespace)=>{
          const currentPath = window.location.pathname;
          const pathSegments = currentPath.split('/');
          const namespaceIndex = pathSegments.findIndex(segment => segment === selectedNamespace);
          if (namespaceIndex !== -1) {
            pathSegments[namespaceIndex] = namespace as string;
            navigate(pathSegments.join('/'));
            setSelectedNamespace(namespace);
          }
        },
        selectedNamespace,
        error,
      }}
    >
      {children}
    </NamespaceContext.Provider>
  );
};

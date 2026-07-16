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
  const navigate = useNavigate();
  
  const getNamespaceFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/(?:orchestration\/kubernetes|v2\/kubernetes|new\/kubernetes|settings\/ci_cd\/library)\/([^\/]+)/);
    return match ? match[1] : "default";
  };

  const [namespaces, setNamespaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>(getNamespaceFromUrl());

  // Listen to URL changes to keep selectedNamespace in sync
  useEffect(() => {
    const urlNamespace = getNamespaceFromUrl();
    if (urlNamespace !== selectedNamespace && urlNamespace !== "default") {
      setSelectedNamespace(urlNamespace);
    }
  }, [window.location.pathname]);

  const fetchNamespaces = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiKubernertesClusterNamespaceGet();
      if (response && (response as any).status === "success" && Array.isArray((response as any).data)) {
        setNamespaces((response as any).data);
        setError("");
      } else if (response && (response as any).error) {
        throw new Error((response as any).error);
      } else if (response && (response as any).message) {
        throw new Error((response as any).message);
      } else {
        throw new Error("Failed to fetch namespaces");
      }
    } catch (err: any) {
      let message = "Failed to fetch namespaces";
      if (err.body && err.body.error) {
        message = err.body.error;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (namespaces.length === 0) {
      fetchNamespaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NamespaceContext.Provider
      value={{
        namespaces,
        isLoading,
        fetchNamespaces,
        setSelectedNamespace: (namespace) => {
          const currentPath = window.location.pathname;
          const match = currentPath.match(/(\/(?:orchestration\/kubernetes|v2\/kubernetes|new\/kubernetes|settings\/ci_cd\/library)\/)[^\/]+/);
          if (match) {
            const newPath = currentPath.replace(
              /(\/(?:orchestration\/kubernetes|v2\/kubernetes|new\/kubernetes|settings\/ci_cd\/library)\/)[^\/]+/,
              `$1${namespace}`
            );
            if (newPath !== currentPath) {
              navigate(newPath);
            }
          }
          setSelectedNamespace(namespace as string);
        },
        selectedNamespace,
        error,
      }}
    >
      {children}
    </NamespaceContext.Provider>
  );
};

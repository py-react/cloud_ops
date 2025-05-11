import { DefaultService } from "@/gingerJs_api_client";
import React, { createContext, useEffect, useState } from "react";
import { toast } from "sonner";


interface INamespaceContext {
  namespaces: {name:string}[];
  isLoading:boolean;
  fetchNamespaces:()=>void;
  setSelectedNamespace:React.Dispatch<React.SetStateAction<string>>;
  selectedNamespace:string;
  error:""
}

export const NamespaceContext = createContext<INamespaceContext>({});

export const NamespaceContextProvider = ({ children }) => {
  const [namespaces, setNamespaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");

  const fetchNamespaces = async () => {
    setIsLoading(true);
    try {
      const response = await DefaultService.apiKubernertesClusterNamespaceGet();
      if(response.status!=="error"){
        setNamespaces(response.data as []);
      }else{
       throw response.message 
      }
    } catch (err) {
      setError("Failed to fetch services")
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(namespaces.length) return
    fetchNamespaces();
  }, [namespaces]);

  return (
    <NamespaceContext.Provider
      value={{
        namespaces,
        isLoading,
        fetchNamespaces,
        setSelectedNamespace,
        selectedNamespace,
        error
      }}
    >
      {children}
    </NamespaceContext.Provider>
  );
};

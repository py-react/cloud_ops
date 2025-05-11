import React, { useEffect, useContext } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NamespaceContext } from "./context/NamespaceContext";

interface NamespaceSelectorProps {}

export function NamespaceSelector({}: NamespaceSelectorProps) {
  const {
    isLoading,
    namespaces,
    fetchNamespaces,
    setSelectedNamespace,
    selectedNamespace,
  } = useContext(NamespaceContext);

  useEffect(() => {
    if (namespaces.length === 0 && !isLoading) {
      fetchNamespaces();
    }
  }, [isLoading, namespaces]);

  const handleNamespaceChange = (value: string) => {
    if(value==="All"){
      setSelectedNamespace("");
    }else{
      setSelectedNamespace(value);
    }
  };

  return (
    <div className="">
      <Select value={selectedNamespace} onValueChange={handleNamespaceChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select namespace" />
        </SelectTrigger>
        <SelectContent>
          {[{ metadata: { name: "All" } }]
            .concat(namespaces || [])
            ?.map((namespace) => (
              <SelectItem
                key={namespace.metadata.name}
                value={namespace.metadata.name
                }
              >
                {namespace.metadata.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

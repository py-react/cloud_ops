import React, { createContext, useState } from "react";

export const InfraContext = createContext({});

export const InfraContextProvider = ({ children }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [resources, setResources] = useState([
      
    ]);
    const [selectedResource, setSelectedResource] = useState(null);
  
  
    const handleResourceSelect = async (resource) => {
      setSelectedResource(resource);
    };

  return (
    <InfraContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        resources,
        setResources,
        selectedResource,
        setSelectedResource,
        handleResourceSelect,
      }}
    >
      {children}
    </InfraContext.Provider>
  );
};

import React, { useEffect, useState } from "react";
import ResourceTable from "../ResourceTable";
import { DefaultService } from "@/gingerJs_api_client";

interface ResourceViewProps {
  resourceType: string;
  namespace?: string;
}

export function ResourceView({ resourceType, namespace }: ResourceViewProps) {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const result = await DefaultService.apiKubernertesResourcesTypeGet({
          type: resourceType,
          namespace,
        });
        setResources(result.data || []);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        setResources([]);
      }
    };

    fetchResources();
  }, [resourceType, namespace]);

  const columns = [
    { key: "metadata.name", header: "Name" },
    { key: "metadata.namespace", header: "Namespace" },
    { key: "metadata.creationTimestamp", header: "Created" },
  ];

  const handleEdit = (resource: any) => {
    console.log("Edit resource:", resource);
    // Implement edit functionality
  };

  const handleDelete = (resource: any) => {
    console.log("Delete resource:", resource);
    // Implement delete functionality
  };

  return (
    <ResourceTable
      resources={resources}
      columns={columns}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

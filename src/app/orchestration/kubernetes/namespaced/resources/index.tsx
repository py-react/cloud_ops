import React from "react";
import { ResourcesList } from "@/components/kubernetes/resources/ResourcesList";
import useNavigate from "@/libs/navigate";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";

export default function KubernetesResourcesPage() {
  const navigate = useNavigate();

  const handleResourceSelect = (resourceType: string) => {
    navigate(
      `/orchestration/kubernetes/namespaced/resources/${resourceType.toLowerCase()}`
    );
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 items-center">
        <NamespaceSelector />
      </div>
      <ResourcesList onSelect={handleResourceSelect} />
    </div>
  );
}

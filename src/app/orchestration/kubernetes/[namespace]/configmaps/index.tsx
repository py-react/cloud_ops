import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form"

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { ContainerIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import yaml from "js-yaml"
import { useNavigate } from "react-router-dom";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Data Keys", accessor: "dataKeys" },
  { header: "Binary Data Keys", accessor: "binaryDataKeys" },
  { header: "Immutable", accessor: "immutable" },
  { header: "Labels", accessor: "labels" },
  { header: "Age", accessor: "age" },
];

interface ConfigMapData {
  name: string;
  namespace: string;
  dataKeys: number;
  binaryDataKeys: number;
  immutable: string;
  labels: string[];
  age: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
}

export default function ConfigMapsPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<ConfigMapData | null>(null);
  const {
    resource: configMaps,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "configmaps",
  });

  const handleViewDetails = (configMaps: any) => {
    navigate(`/orchestration/kubernetes/${configMaps.namespace}/configmaps/${configMaps.name}`)
  };

  // Transform API data to match table format
  const transformedConfigMaps: ConfigMapData[] =
    configMaps?.map((cm: any) => ({
      name: cm.metadata?.name || "",
      namespace: cm.metadata?.namespace || "",
      dataKeys: Object.keys(cm.data || {}).length,
      binaryDataKeys: Object.keys(cm.binaryData || {}).length,
      immutable: cm.immutable ? "Yes" : "No",
      labels: Object.entries(cm.metadata?.labels || {}).map(
        ([key, value]) => `${key}: ${value}`
      ),
      age: cm.metadata?.creationTimestamp
        ? new Date(cm.metadata.creationTimestamp).toLocaleDateString()
        : "Unknown",
      last_applied: cm.metadata?.annotations?.["kubectl.kubernetes.io/last-applied-configuration"],
      fullData: cm,
      showViewDetails: true,
      showEdit: true,
      showDelete: true,
    })) || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="ConfigMaps"
      subtitle="View and manage Kubernetes ConfigMaps—store and manage non-confidential configuration data."
      icon={ContainerIcon}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector />
          <Button onClick={() => setShowCreateDialog(true)}>
            <ContainerIcon className="w-4 h-4 mr-2" />
            Create ConfigMap
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your ConfigMaps</CardTitle>
              <CardDescription>
                {transformedConfigMaps.length} ConfigMaps found
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedConfigMaps}
              onViewDetails={handleViewDetails}
              onEdit={(res: ConfigMapData) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data: ConfigMapData) => {
                let menifest = data.last_applied
                  ? yaml.dump(JSON.parse(data.last_applied))
                  : "";
                if (!menifest) {
                  menifest = yaml.dump({
                    apiVersion: data.fullData.apiVersion,
                    kind: data.fullData.kind,
                    metadata: {
                      name: data.fullData.metadata.name,
                      namespace: data.fullData.metadata.namespace,
                    },
                  });
                }
                DefaultService.apiKubernertesMethodsDeletePost({
                  requestBody: {
                    manifest: menifest,
                  },
                })
                  .then((res: any) => {
                    if (res.success) {
                      toast.success(res.data.message);
                      refetch();
                    } else {
                      toast.error(res.error);
                    }
                  })
                  .catch((err) => {
                    toast.error(err);
                  });
              }}
            />
          </CardContent>
        </Card>
      </div>
      {showCreateDialog && (
        <ResourceForm
          heading="ConfigMap resource"
          description="A Kubernetes ConfigMap is a resource used to store non-confidential configuration data in key-value pairs. ConfigMaps can be consumed by pods as environment variables, command-line arguments, or as configuration files in a volume. They are useful for storing configuration data that can be updated without rebuilding container images, making them ideal for managing application configuration and settings."
          editDetails={showCreateDialog}
          rawYaml={
            currentToEdit
              ? yaml.dump(
                currentToEdit?.last_applied
                  ? JSON.parse(currentToEdit?.last_applied)
                  : currentToEdit.fullData
              )
              : ""
          }
          resourceType="configmaps"
          onClose={() => {
            setShowCreateDialog(false);
            setCurrentToEdit(null);
          }}
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res: any) => {
                if (res.success) {
                  toast.success(res.data.message);
                  refetch();
                  setShowCreateDialog(false);
                } else {

                  toast.error(res.error);
                }
              })
              .catch((err) => {
                toast.error(err);
              });
          }}
        />
      )}
    </PageLayout>
  );
}
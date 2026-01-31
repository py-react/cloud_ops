import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form";

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { FileKeyIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import yaml from "js-yaml";
import useNavigate from "@/libs/navigate";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Type", accessor: "type" },
  { header: "Data Keys", accessor: "dataKeys" },
  { header: "Labels", accessor: "labels" },
  { header: "Age", accessor: "age" },
];

interface SecretData {
  name: string;
  namespace: string;
  type: string;
  dataKeys: number;
  labels: string[];
  age: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
}

export default function SecretsPage() {
  const navigate = useNavigate()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<SecretData | null>(null);
  const {
    resource: secrets,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: "secrets",
  });

  // Transform API data to match table format
  const transformedSecrets: SecretData[] =
    secrets?.map((secret: any) => ({
      name: secret.metadata?.name || "",
      namespace: secret.metadata?.namespace || "",
      type: secret.type || "Opaque",
      dataKeys: Object.keys(secret.data || {}).length,
      labels: Object.entries(secret.metadata?.labels || {}).map(
        ([key, value]) => `${key}: ${value}`
      ),
      age: secret.metadata?.creationTimestamp
        ? new Date(secret.metadata.creationTimestamp).toLocaleDateString()
        : "Unknown",
      last_applied: secret.metadata?.annotations?.["kubectl.kubernetes.io/last-applied-configuration"],
      fullData: secret,
      showViewDetails: true,
      showEdit: true,
      showDelete: true,
    })) || [];

  const handleViewDetails = (secret: any) => {
    navigate(`/orchestration/kubernetes/${secret.namespace}/secrets/${secret.name}`)
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Secrets"
      subtitle="Manage your Kubernetes Secrets—create, edit, or delete sensitive data used by your applications."
      icon={FileKeyIcon}
      actions={
        <div className="flex items-center gap-2">
          <NamespaceSelector />
          <Button onClick={() => setShowCreateDialog(true)}>
            <FileKeyIcon className="w-4 h-4 mr-2" />
            Create Secret
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Secrets</CardTitle>
              <CardDescription>
                {transformedSecrets.length} Secrets found
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedSecrets}
              onEdit={(res: SecretData) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onViewDetails={handleViewDetails}
              onDelete={(data: SecretData) => {
                let manifest = data.last_applied
                  ? yaml.dump(JSON.parse(data.last_applied))
                  : "";
                if (!manifest) {
                  manifest = yaml.dump({
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
                    manifest: manifest,
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
          heading="Secret resource"
          description="A Kubernetes Secret is a resource used to securely store and manage sensitive information such as passwords, tokens, SSH keys, and TLS certificates. Unlike ConfigMaps, Secrets are base64 encoded and handled with tighter access controls to reduce the risk of exposure. They can be mounted into Pods as files or exposed as environment variables at runtime."
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
          resourceType="secrets"
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
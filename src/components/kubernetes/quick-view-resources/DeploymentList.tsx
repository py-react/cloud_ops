import React, { useState } from "react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import ResourceForm from "@/components/resource-form/resource-form";
import yaml from "js-yaml"

export interface DeploymentItem {
  metadata: {
    uid: string;
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    replicas: number;
    strategy?: {
      type?: string;
    };
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      spec: {
        containers: Container[];
      };
    };
  };
  status: {
    readyReplicas: number;
    conditions?: Condition[];
  };
}

export interface Container {
  name: string;
  image: string;
  imagePullPolicy: string;
  args?: string[];
  ports?: Array<{
    name?: string;
    containerPort: number;
    protocol: string;
  }>;
  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: {
      fieldRef?: {
        fieldPath: string;
      };
    };
  }>;
  livenessProbe?: {
    httpGet?: {
      path?: string;
      port?: number | string;
    };
    initialDelaySeconds?: number;
    periodSeconds?: number;
  };
}

export interface Condition {
  type: string;
  status: string;
  message: string;
  lastUpdateTime: string;
}

interface DeploymentListProps {
  deployments: DeploymentItem[];
  refetch: () => void;
}

export function DeploymentList({ deployments,refetch }: DeploymentListProps) {
  const [editDetails,setEditDetails] = useState(false)
  const [currentToEdit,setCurrentToEdit] = useState(null)
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Replicas", accessor: "replicas" },
    { header: "Ready", accessor: "readyReplicas" },
    { header: "Strategy", accessor: "strategy" },
    { header: "Labels", accessor: "labels" },
    { header: "Status", accessor: "status" },
  ];

  const data = deployments.map((dep) => {
    console.log({dep})
    return ({
      name: dep.metadata.name,
      namespace: dep.metadata.namespace,
      replicas: dep.spec.replicas,
      readyReplicas: dep.status.readyReplicas,
      strategy: dep.spec.strategy?.type ?? "N/A",
      labels: Object.entries(dep.metadata.labels || {}).map(
        ([key, value]) => `${key}: ${value}`
      ),
      status: inferStatus(dep.status.conditions),
      last_applied:dep.metadata?.annotations[
        "kubectl.kubernetes.io/last-applied-configuration"
      ],
      // Include full object for dialogs or mock config
      fullData: dep,
      showEdit:true,
      showDelete:true
    })
  });

  return (
    <>
      <ResourceTable
        columns={columns}
        data={data}
        // onViewDetails={(res) => {
        //   // You can access full deployment object using res.fullData
        //   console.log("View Details for Deployment:", res);
        // }}
        // onViewLogs={(res) => {
        //   console.log("View Logs for Deployment:", res);
        // }}
        onEdit={(res) => {
          setEditDetails(true);
          setCurrentToEdit(res);
        }}
        onDelete={(data) => {
          DefaultService.apiKubernertesMethodsDeletePost({
            requestBody: {
              manifest: yaml.dump(JSON.parse(data.last_applied)),
            },
          })
            .then((res) => {
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
        // onViewConfig={(res) => {
        //   console.log("View Config for Deployment:", res.fullData);
        // }}
      />
      {editDetails && currentToEdit && (
        <ResourceForm
          resourceType="deployments"
          editDetails={editDetails}
          rawYaml={yaml.dump(JSON.parse(currentToEdit?.last_applied))}
          onClose={()=>setEditDetails(false)}
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res) => {
                if (res.success) {
                  toast.success(res.data.message);
                  refetch();
                  setEditDetails(false);
                  setCurrentToEdit(null);
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
    </>
  );
}

function inferStatus(conditions?: DeploymentItem["status"]["conditions"]): string {
  if (!conditions || conditions.length === 0) return "Unknown";
  const progessingCondition = conditions.find(c=>c.type ==="Progressing")
  const readyCondition = conditions.find((c) => c.type === "Available" || c.type === "Ready" );
  if(readyCondition?.status === "False" && progessingCondition?.status === "True") return "Pending"
  if (readyCondition?.status === "True") return "Running";
  if (readyCondition?.status === "False") return "Failed";
  return "Pending";
}
import React, { useState } from "react";
import { ResourceTable } from "../resources/resourceTable";

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

interface IDeploymentList {
  deployments: DeploymentItem[];
}

export function DeploymentList({ deployments }: IDeploymentList) {
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
      // Include full object for dialogs or mock config
      fullData: dep,
    })
  });

  return (
    <ResourceTable
      columns={columns}
      data={data}
      onViewDetails={(res) => {
        // You can access full deployment object using res.fullData
        console.log("View Details for Deployment:", res);
      }}
      onViewLogs={(res) => {
        console.log("View Logs for Deployment:", res);
      }}
      onViewConfig={(res) => {
        console.log("View Config for Deployment:", res.fullData);
      }}
      tableClassName="max-h-[490px]"
    />
  );
}

function inferStatus(conditions?: DeploymentItem["status"]["conditions"]): string {
  if (!conditions || conditions.length === 0) return "Unknown";

  const readyCondition = conditions.find((c) => c.type === "Available" || c.type === "Ready");
  if (readyCondition?.status === "True") return "Running";
  if (readyCondition?.status === "False") return "Failed";

  return "Pending";
}
import React, { useState } from "react";
import { ResourceTable } from "../resources/resourceTable";

export interface Pod {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
  };
  spec: {
    nodeName?: string;
  };
  status: {
    phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
    podIP?: string;
    startTime?: string;
    conditions?: Array<{
      type: string;
      status: string;
    }>;
    containerStatuses?: Array<{
      name: string;
      ready: boolean;
      restartCount: number;
      state: {
        running?: { startedAt: string };
        waiting?: { reason: string };
        terminated?: { reason: string; exitCode: number };
      };
    }>;
  };
}

interface IPodsList {
  pods: Pod[];
  onEdit: (pod: Pod) => void;
  onDelete: (pod: Pod) => void;
}

export function PodsList({ pods,onEdit,onDelete }: IPodsList) {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Status", accessor: "phase" },
    { header: "Created", accessor: "creationTimestamp" },
    { header: "On Node", accessor: "nodeName" },
    { header: "Containers", accessor: "containers" },
  ];

  const data = pods.map((pod) => {
    console.log({pod})
    return ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      phase: pod.status.phase,
      creationTimestamp: new Date(pod.metadata.creationTimestamp).toLocaleString(),
      nodeName: pod.spec.nodeName || 'N/A',
      containers: pod.status.containerStatuses?.length || 0,
      // Include full object for dialogs or mock config
      fullData: pod,
    })
  });

  return (
    <ResourceTable
      columns={columns}
      data={data}
      onViewDetails={onEdit}
      onDelete={onDelete}
      tableClassName="max-h-[490px]"
    />
  );
}
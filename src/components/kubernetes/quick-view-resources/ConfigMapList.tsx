import React from "react";
import { ResourceTable } from "../resources/resourceTable";

type Time = string;

interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

interface ManagedFieldsEntry {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: Record<string, any>;
  manager?: string;
  operation?: string;
  subresource?: string;
  time?: Time;
}

export interface ConfigMap {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    uid?: string;
    creationTimestamp?: Time;
    deletionTimestamp?: Time;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: OwnerReference[];
    managedFields?: ManagedFieldsEntry[];
  };
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

interface IConfigMapTable {
  configMaps: ConfigMap[];
  onDelete:(configMap: ConfigMap) => Promise<void>
  onEdit:(configMap: ConfigMap) => Promise<void>
}

export function ConfigMapList({ configMaps, onDelete }: IConfigMapTable) {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Immutable", accessor: "immutable" },
    { header: "Data Count", accessor: "dataCount" },
    { header: "Binary Data Count", accessor: "binaryDataCount" },
    { header: "Created", accessor: "creationTimestamp" },
  ];

  const data = configMaps.map((configMap) => {
    console.log({configMap})
    return ({
      name: configMap?.metadata?.name,
      namespace: configMap?.metadata?.namespace,
      immutable: configMap.immutable ? 'True' : 'False',
      creationTimestamp : new Date(configMap.metadata?.creationTimestamp || '').toLocaleString(),
      dataCount:Object.keys(configMap.data || {}).length,
      binaryDataCount:Object.keys(configMap.binaryData || {}).length,
      // Include full object for dialogs or mock config
      fullData: configMap,
    })
  });

  return (
    <ResourceTable
      columns={columns}
      data={data}
      // onViewDetails={(res) => {
      //   // You can access full deployment object using res.fullData
      //   console.log("View Details for ConfigMap:", res);
      // }}
      // onViewLogs={(res) => {
      //   console.log("View Logs for ConfigMap:", res);
      // }}
      // onViewConfig={(res) => {
      //   console.log("View Config for ConfigMap:", res.fullData);
      // }}
      onDelete={onDelete}
      tableClassName="max-h-[490px]"
    />
  );
}

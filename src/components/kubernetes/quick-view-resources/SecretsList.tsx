import React, { useState } from "react";
import { ResourceTable } from "../resources/resourceTable";


interface ISecret {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  type: string;
  data:Record<string,string>[],
}

interface ISecretList {
  secrets:ISecret[]
  onView:(data:ISecret)=>Promise<void>
}


export function SecretsList({ secrets,onView }: ISecretList) {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Type", accessor: "type" },
    { header: "Created", accessor: "creationTimestamp" },
  ];

  const data = secrets.map((secret) => {
    console.log({secret})
    return ({
      name: secret.metadata.name,
      namespace: secret.metadata.namespace,
      type: secret.type,
      creationTimestamp: new Date(secret.metadata.creationTimestamp).toLocaleString(),
      // Include full object for dialogs or mock config
      fullData: secret,
    })
  });

  return (
    <ResourceTable
      columns={columns}
      data={data}
      onViewDetails={onView}
      tableClassName="max-h-[490px]"
    />
  );
}
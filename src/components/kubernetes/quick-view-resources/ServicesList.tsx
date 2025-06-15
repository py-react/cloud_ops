import React from "react";
import { ResourceTable } from "../resources/resourceTable";

interface IServicesList {
  services:Record<string,any>[]
}

export function ServicesList({ services }: IServicesList) {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Type", accessor: "type" },
    { header: "ClusterIP", accessor: "clusterIP" },
    { header: "ExternalIPs", accessor: "externalIPs" },
    { header: "Created", accessor: "creationTimestamp" },
  ];

  const data = services.map((service) => {
    return ({
      name: service.metadata.name,
      namespace: service.metadata.namespace,
      type: service.spec.type,
      clusterIP:service.spec.clusterIP,
      externalIPs:service.externalIPs?.join(",")||"",
      creationTimestamp: new Date(service.metadata.creationTimestamp).toLocaleString(),
      // Include full object for dialogs or mock config
      fullData: service,
    })
  });

  return (
    <ResourceTable
      columns={columns}
      data={data}
      tableClassName="max-h-[490px]"
    />
  );
}
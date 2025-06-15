import React from "react";
import { ResourceTable } from "../resources/resourceTable";

interface IIngressList {
  ingress:Record<string,any>[]
}

export function IngressList({ ingress }: IIngressList) {
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Namespace", accessor: "namespace" },
    { header: "Ingress Class", accessor: "type" },
    { header: "ClusterIP", accessor: "clusterIP" },
    { header: "ExternalIPs", accessor: "externalIPs" },
    { header: "Created", accessor: "creationTimestamp" },
  ];

  const data = ingress.map((item) => {
    return ({
      name: item.metadata.name,
      namespace: item.metadata.namespace,
      IngressClass: item.spec.ingressClassName,
      tls:item.spec.tls ? 'Enabled' : 'Disabled',
      ingressClassName:item.spec.ingressClassName,
      creationTimestamp: new Date(item.metadata.creationTimestamp).toLocaleString(),
      // Include full object for dialogs or mock config
      fullData: item,
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
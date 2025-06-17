import React, { useContext, useState } from 'react'
import { Button } from "@/components/ui/button"
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { NamespaceSelector } from '@/components/kubernetes/NamespaceSelector'
import useKubernertesResources from '@/hooks/use-resource'
import RouteDescription from '@/components/route-description'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NetworkIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ServicesList } from '@/components/kubernetes/quick-view-resources/ServicesList'


export default function ServicesPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");

  const {
    resource: services,
    isLoading,
    error
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "services" })

  const filteredServices =
    services?.filter(
      (service) =>
        service.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }


  return (
    <div>
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <NetworkIcon className="h-4 w-4" />
              <h2>Services</h2>
            </div>
          }
          shortDescription="Manage your Kubernetes Services—create, inspect, and control access to workloads running in your cluster."
          description="Services in Kubernetes provide a stable network endpoint to expose applications running on a set of Pods. They abstract away Pod IPs and enable reliable communication within the cluster or to external consumers. Services support different types—ClusterIP, NodePort, LoadBalancer, and ExternalName—each suited for specific use cases."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Pods</CardTitle>
              <CardDescription>
                Pods from {selectedNamespace || "All"} namespace
              </CardDescription>
            </div>
            <div className="w-full flex items-center max-w-sm gap-2">
              <NamespaceSelector />

              <Button>Create pods</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ServicesList services={filteredServices} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


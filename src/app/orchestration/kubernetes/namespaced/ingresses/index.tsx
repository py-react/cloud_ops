import React,{ useContext, useState } from 'react'
import { Button } from "@/components/ui/button"

import { NamespaceContext } from '@/components/kubernetes/context/NamespaceContext'
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
import { Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IngressList } from '@/components/kubernetes/quick-view-resources/IngressList'

export default function IngressPage() {
  const {selectedNamespace} = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");

  const {
    resource:ingress,
    isLoading,
    error
  } = useKubernertesResources({nameSpace:selectedNamespace,type:"ingresses"})

  const filteredIngress =
  ingress?.filter(
      (ingress) =>
        ingress.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Globe className="h-4 w-4" />
              <h2>Ingresses</h2>
            </div>
          }
            shortDescription='Manage your Kubernetes Ingress resources—configure routing rules to expose services externally.'
            description='Ingress in Kubernetes is an API object that manages external access to services within a cluster, typically over HTTP or HTTPS. It defines routing rules to direct traffic based on hostnames or paths, allowing multiple services to share a single external IP. Ingress works in conjunction with an Ingress Controller, which implements the actual routing.'
          />
          <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Ingresses</CardTitle>
              <CardDescription>
                Ingresses from {selectedNamespace||"All"} namespace
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button >
                Create Ingress
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
          <div className="relative px-6">
                <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search ingresses..."
                  className="w-full pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            <IngressList ingress={filteredIngress} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


import React, { useContext,useState } from 'react'
import { Button } from "@/components/ui/button"
import { NamespaceContext } from '@/components/kubernetes/contextProvider/NamespaceContext'
import { DeploymentList } from '@/components/kubernetes/quick-view-resources/DeploymentList'
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
import { RocketIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DeploymentPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");
  const {
    resource: deployments,
    isLoading,
    error
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "deployments" })

  const filteredDeployments =
  deployments?.filter(
      (deployment) =>
        deployment.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];


  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <RocketIcon className='h-4 w-4'/>
              <h2>Deployments</h2>
            </div>
          }
          shortDescription='Manage your Kubernetes deployments—view status, scale replicas, update images, or delete deployments from a centralized interface.'
          description='Kubernetes Deployments are used to manage the lifecycle of stateless applications. They define the desired state for Pods and ReplicaSets, making it easy to perform rolling updates and rollbacks. Deployments help ensure high availability by automatically replacing failed or outdated Pods. They are essential for managing scalable, reliable applications in a Kubernetes cluster.'
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your deployment</CardTitle>
              <CardDescription>
                Deployments from {selectedNamespace||"All"} namespace
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button>
                Create Deployment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
                <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search deployments..."
                  className="w-full pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DeploymentList deployments={filteredDeployments} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


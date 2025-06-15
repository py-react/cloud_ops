import React, { useContext, useState } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Pod, PodTable } from '@/components/kubernetes/PodTable'
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
import { BoxIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PodsList } from '@/components/kubernetes/quick-view-resources/PodsList'

export default function PodsPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");

  const {
    resource: pods,
    isLoading,
    error,
    refetch
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "pods" })

  const filteredPods =
    pods?.filter(
      (pod) =>
        pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];


  const handleEdit = (pod: Pod) => {
    // Implement edit functionality
    console.log('Edit pod:', pod)
  }



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
              <BoxIcon className='h-4 w-4' />
              <h2>Pods</h2>
            </div>
          }
          shortDescription='Manage your Kubernetes Pods—inspect status, view logs, restart, or delete running workloads.'
          description='Pods are the smallest and most fundamental compute units in Kubernetes. Each Pod encapsulates one or more containers that share the same network namespace and storage. They are designed to run a single instance of a process and are managed by higher-level controllers like Deployments.'
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Pods</CardTitle>
              <CardDescription>
                Pods from {selectedNamespace || "All"} namespace
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              
              <NamespaceSelector />
              <Button >
                Create pods
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
          <div className="relative px-6">
                <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pods..."
                  className="w-full pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            <PodsList
              pods={filteredPods as Pod[]}
              onEdit={handleEdit}
              onDelete={() => { }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
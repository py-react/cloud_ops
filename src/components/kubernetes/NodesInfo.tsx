import React,{ useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Server, Cpu, HardDrive, AlertTriangle, CheckCircle2, Network, Tag, Info, Disc, Activity, Clock, Hash, Zap, HandCoinsIcon, ScalingIcon, ImageIcon } from 'lucide-react'

function formatBytes(bytes: number | undefined, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function parseDockerImageNames(imageList:string[]|undefined) {
  const results = [] as string[];
  if(!imageList) return results;
  for (const fullName of imageList) {
    // Updated regex to capture full hash or version
    const regex = /^(?<registry>[^/]+)\/(?<repository>[^:@]+)(?::(?<tag>[a-zA-Z0-9\-.]+))?(?:@sha256:(?<hash>[a-f0-9]{64}))?/;
    const match = fullName.match(regex);

    if (match && match.groups) {
      const { registry, repository, tag, hash } = match.groups;
      const version = hash ? hash.slice(0, 12) : tag || "latest";
      const formatted = `${registry}/${repository}:${version}`;
      results.push(formatted);
    }
  }

  return results;
}

const NodeCard = ({ node }: { node: Record<string,any> }) => {
  const [isOpen,setIsOpen] = useState(false)
  const status = node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'Not Ready'
  const osImage = node.status?.nodeInfo?.osImage || 'Unknown OS'
  const kubeletVersion = node.status?.nodeInfo?.kubeletVersion || 'Unknown version'
  const provider = node.spec?.providerID || 'Unknown Provider'

  return (
      <Card className="w-full p-4 border border-gray-200 rounded-lg">
        <CardHeader className="p-0 pb-2 flex flex-row justify-between items-start ">
          <div>
            <CardTitle className="flex items-center gap-2 pb-1">
              <Server className="h-5 w-5" />
              {node.metadata?.name || 'Unnamed Node'}
            </CardTitle>
            <CardDescription>{osImage}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={`rounded ${status === 'Ready' ? 'bg-green-50 text-green-600 hover:bg-green-50 hover:text-green-600' : 'bg-red-50 hover:bg-red-50 text-red-600 hover:text-red-600'}`} >
              {status === 'Ready' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              {status}
            </Badge>
              <ScalingIcon onClick={()=>{
              setIsOpen(true)
            }}  className="h4 w-4 cursor-pointer" />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <HandCoinsIcon className="h-4 w-4" />
              <span className="text-sm">Provider: {provider}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Kubelet: {kubeletVersion}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">
                Capacity: {node.status?.capacity?.cpu || 'N/A'} CPU, {node.status?.capacity?.memory || 'N/A'} Memory
              </span>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{node.metadata?.name || 'Unnamed Node'}</DialogTitle>
                <DialogDescription>{osImage}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 p-4">
                  {node.status?.daemonEndpoints?.kubeletEndpoint && (
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5" /> Daemon Endpoints
                      </h3>
                      <ul className="list-disc list-inside">
                        <li>Kubelet: Port {node.status.daemonEndpoints.kubeletEndpoint.Port}</li>
                      </ul>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <HardDrive className="h-5 w-5" /> Resources
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="font-medium">Capacity:</h4>
                        <ul className="list-disc list-inside">
                          <li>CPU: {node.status?.capacity?.cpu}</li>
                          <li>Memory: {node.status?.capacity?.memory}</li>
                          <li>Pods: {node.status?.capacity?.pods}</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">Allocatable:</h4>
                        <ul className="list-disc list-inside">
                          <li>CPU: {node.status?.allocatable?.cpu}</li>
                          <li>Memory: {node.status?.allocatable?.memory}</li>
                          <li>Pods: {node.status?.allocatable?.pods}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Network className="h-5 w-5" /> Addresses
                    </h3>
                    <ul className="list-disc list-inside">
                      {node.status?.addresses?.map((address, index) => (
                        <li key={index}>{address.type}: {address.address}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Info className="h-5 w-5" /> System Info
                    </h3>
                    <ul className="list-disc list-inside grid grid-cols-2 gap-2">
                      <li>OS: {node.status?.nodeInfo?.operatingSystem}</li>
                      <li>Architecture: {node.status?.nodeInfo?.architecture}</li>
                      <li>Container Runtime: {node.status?.nodeInfo?.containerRuntimeVersion}</li>
                      <li>Kernel Version: {node.status?.nodeInfo?.kernelVersion}</li>
                      <li>Boot ID: {node.status?.nodeInfo?.bootID}</li>
                      <li>Machine ID: {node.status?.nodeInfo?.machineID}</li>
                      <li>System UUID: {node.status?.nodeInfo?.systemUUID}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Conditions
                    </h3>
                    <ul className="list-disc list-inside">
                      {node.status?.conditions?.map((condition, index) => (
                        <li className={`p-1 ${condition.status?"bg-green-50 text-green-600":"bg-red-50 hover:bg-red-50"}`} key={index}>{condition.type}: {condition.message}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Tag className="h-5 w-5" /> Labels
                    </h3>
                    <ul className="list-disc list-inside">
                      {Object.entries(node.metadata?.labels || {}).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Disc className="h-5 w-5" /> Volumes
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="font-medium">Attached:</h4>
                        <ul className="list-disc list-inside">
                          {node.status?.volumesAttached?.map((volume, index) => (
                            <li key={index}>{volume.name}: {volume.devicePath}</li>
                          )) || <li>None</li>}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">In Use:</h4>
                        <ul className="list-disc list-inside">
                          {node.status?.volumesInUse?.map((volume, index) => (
                            <li key={index}>{volume}</li>
                          )) || <li>None</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" /> Timestamps
                    </h3>
                    <ul className="list-disc list-inside">
                      <li>Creation: {node.metadata?.creationTimestamp}</li>
                      {node.metadata?.deletionTimestamp && (
                        <li>Deletion: {node.metadata.deletionTimestamp}</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Hash className="h-5 w-5" /> Misc
                    </h3>
                    <ul className="list-disc list-inside">
                      <li>UID: {node.metadata?.uid}</li>
                      <li>Resource Version: {node.metadata?.resourceVersion}</li>
                      <li>Phase: {node.status?.phase || 'N/A'}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" /> Images
                    </h3>
                    <ul className="list-disc list-inside">
                      {node.status?.images?.map((image, index) => {
                        return (
                          <li key={index}>
                            {parseDockerImageNames(image.names).map(name => (<><span>{name}</span><br/></>))}
                            <span className="text-sm text-gray-500"> ({formatBytes(image.sizeBytes)})</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
  )
}

const LoadingSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-5 w-16" />
    </CardFooter>
  </Card>
)

export default function KubernetesNodesList({items}:{items:Node[]}) {
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<Node[]>([])

  useEffect(()=>{
    if(items){
      setNodes(items)
      setLoading(false)
    }
  },[items])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle>No Nodes Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are currently no Kubernetes nodes in the cluster.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        {nodes.map((node) => (
          <NodeCard key={node.metadata?.uid} node={node} />
        ))}
    </div>
  )
}


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
import { ShuffleIcon, Server, Lock, Link, Tag, Info } from 'lucide-react'
import SmartDataViewer from '../queues/queueJob/SmartDataViewer'

type Ingress = {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    generation: number;
    creationTimestamp: string;
    annotations?: Record<string, string>;
  };
  spec: {
    ingressClassName: string;
    tls?: Array<{
      hosts: string[];
      secretName: string;
    }>;
    rules: Array<{
      host: string;
      http: {
        paths: Array<{
          path: string;
          pathType: string;
          backend: {
            service: {
              name: string;
              port: {
                number: number;
              };
            };
          };
        }>;
      };
    }>;
  };
  status: {
    loadBalancer: {
      ingress: Array<{
        hostname: string;
      }>;
    };
  };
};

const IngressCard = ({ ingress }: { ingress: Ingress }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div>
        <Card className="w-full border border-gray-200 cursor-pointer" onClick={() => setIsOpen(true)}>
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
              <ShuffleIcon className="h-5 w-5" />
              {ingress.metadata.name}
            </CardTitle>
            <CardDescription>Namespace: {ingress.metadata.namespace}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 py-2">
            <div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="text-sm">Ingress Class: {ingress.spec.ingressClassName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm">
                  TLS: {ingress.spec.tls ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0">
            <Badge variant="secondary">
              {ingress.spec.ingressClassName}
            </Badge>
          </CardFooter>
        </Card>
      </div>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{ingress.metadata.name}</DialogTitle>
          <DialogDescription>Namespace: {ingress.metadata.namespace}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShuffleIcon className="h-5 w-5" /> Rules
              </h3>
              {ingress.spec.rules.map((rule, index) => (
                <div key={index} className="ml-4 mt-2">
                  <h4 className="font-medium">Host: {rule.host}</h4>
                  <ul className="list-disc list-inside">
                    {rule.http.paths.map((path, pathIndex) => (
                      <li key={pathIndex}>
                        Path: {path.path} ({path.pathType})
                        <ul className="list-none ml-4">
                          <li>Service: {path.backend.service.name}</li>
                          <li>Port: {path.backend.service.port.number}</li>
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {ingress.spec.tls && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5" /> TLS
                </h3>
                {ingress.spec.tls.map((tls, index) => (
                  <div key={index} className="ml-4 mt-2">
                    <h4 className="font-medium">Secret: {tls.secretName}</h4>
                    <ul className="list-disc list-inside">
                      {tls.hosts.map((host, hostIndex) => (
                        <li key={hostIndex}>{host}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link className="h-5 w-5" /> Load Balancer
              </h3>
              <ul className="list-disc list-inside">
                {ingress.status.loadBalancer.ingress?.map((lb, index) => (
                    <React.Fragment key={index}>
                        {Object.entries(lb).map(([key,value])=>(
                          <li key={key}>{key}: {value}</li>
                        ))}
                    </React.Fragment>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Annotations
              </h3>
              <ul className="list-disc list-inside">
                {Object.entries(ingress.metadata.annotations || {}).map(([key, value]) => (
                  <li key={key}>
                    {key.endsWith("kubectl.kubernetes.io/last-applied-configuration")?(
                        <SmartDataViewer label={key} data={JSON.parse(value)} />
                        
                    ):(
                        <>
                        <span className="font-medium">{key}:</span> {value}
                        </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" /> Metadata
              </h3>
              <ul className="list-disc list-inside">
                <li>UID: {ingress.metadata.uid}</li>
                <li>Resource Version: {ingress.metadata.resourceVersion}</li>
                <li>Generation: {ingress.metadata.generation}</li>
                <li>Creation Timestamp: {ingress.metadata.creationTimestamp}</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const LoadingSkeleton = () => (
  <Card className="w-full border border-gray-200">
    <CardHeader className="p-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent className="px-4 pb-4 pt-0">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardContent>
    <CardFooter className="px-4 py-3">
      <Skeleton className="h-5 w-16" />
    </CardFooter>
  </Card>
)

export default function KubernetesIngressList({ingressList}:{ingressList}) {
  const [loading, setLoading] = useState(true)
  const [ingresses, setIngresses] = useState<Ingress[]>([])

  // Simulate API call
  useEffect(() => {
      setIngresses(ingressList)
      setLoading(false)
  },[ingressList])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (ingresses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle>No Ingresses Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are currently no Kubernetes ingresses in the cluster.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        {ingresses.map((ingress) => (
          <IngressCard key={ingress.metadata.uid} ingress={ingress} />
        ))}
    </div>
  )
}


import React,{ useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { CheckCircle2, AlertTriangle, Clock, Tag, HandCoinsIcon } from 'lucide-react'
import { format } from 'date-fns'
import SmartDataViewer from '../queues/queueJob/SmartDataViewer'

export type IssuerType = {
  apiVersion: string;
  kind: string;
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
    selfSigned: Record<string, never>;
  };
  status: {
    conditions: Array<{
      lastTransitionTime: string;
      observedGeneration: number;
      reason: string;
      status: string;
      type: string;
    }>;
  };
};

const IssuerCard = ({ issuer }: { issuer: IssuerType }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isReady = issuer.status.conditions.some(
    condition => condition.type === 'Ready' && condition.status === 'True'
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div
       
      >
        <Card 
          className="w-full border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
              <HandCoinsIcon className="h-5 w-5" />
              {issuer.metadata.name}
            </CardTitle>
            <CardDescription>Namespace: {issuer.metadata.namespace}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Type: Self-Signed</span>
              </div>
              <Badge variant={isReady ? "success" : "destructive"}>
                {isReady ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                {isReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{issuer.metadata.name}</DialogTitle>
          <DialogDescription>Namespace: {issuer.metadata.namespace}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HandCoinsIcon className="h-5 w-5" /> Issuer Details
              </h3>
              <div className="ml-4 mt-2">
                <p><span className="font-medium">Type:</span> Self-Signed</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Annotations
              </h3>
              <ul className="list-disc list-inside">
                {Object.entries(issuer.metadata.annotations || {}).map(([key, value]) => (
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
                <CheckCircle2 className="h-5 w-5" /> Status
              </h3>
              <div className="ml-4 mt-2">
                {issuer.status.conditions.map((condition, index) => (
                  <div key={index} className="mb-4 p-3 border rounded">
                    <p className="font-medium flex items-center gap-2">
                      {condition.type}
                      <Badge variant={condition.status === 'True' ? 'success' : 'secondary'}>
                        {condition.status}
                      </Badge>
                    </p>
                    <p className="text-sm mt-1">Reason: {condition.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last Transition: {format(new Date(condition.lastTransitionTime), 'PPpp')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Metadata
              </h3>
              <div className="ml-4 mt-2 space-y-1">
                <p><span className="font-medium">UID:</span> {issuer.metadata.uid}</p>
                <p><span className="font-medium">Resource Version:</span> {issuer.metadata.resourceVersion}</p>
                <p><span className="font-medium">Generation:</span> {issuer.metadata.generation}</p>
                <p><span className="font-medium">Creation:</span> {format(new Date(issuer.metadata.creationTimestamp), 'PPpp')}</p>
              </div>
            </div>
            <div>
                <SmartDataViewer data={issuer.spec} label='Spec' initiallyOpen={true}   />
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
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
  </Card>
)

export default function KubernetesIssuerList({items}:{items:IssuerType[]}) {
  const [loading, setLoading] = useState(true)
  const [issuers, setIssuers] = useState<IssuerType[]>([])

  // Simulate API call
  useEffect(() => {
      setIssuers(items)
      setLoading(false)
  },[])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (issuers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle>No Issuers Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are currently no certificate issuers in the cluster.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        {issuers.map((issuer) => (
          <IssuerCard key={issuer.metadata.uid} issuer={issuer} />
        ))}
    </div>
  )
}


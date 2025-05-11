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
import { BadgeIcon as Certificate, Key, Clock, Tag, Shield, CheckCircle2, AlertTriangle, FileKey, RefreshCw,LinkIcon, HandCoinsIcon } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

type CertificateType = {
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
      ownerReferences?: Array<{
        apiVersion: string;
        blockOwnerDeletion: boolean;
        controller: boolean;
        kind: string;
        name: string;
        uid: string;
      }>;
    };
    spec: {
      commonName?: string;
      dnsNames: string[];
      duration?: string;
      issuerRef: {
        group?: string;
        kind: string;
        name: string;
      };
      renewBefore?: string;
      secretName: string;
      usages?: string[];
    };
    status: {
      conditions: Array<{
        lastTransitionTime: string;
        message: string;
        observedGeneration: number;
        reason: string;
        status: string;
        type: string;
      }>;
      notAfter: string;
      notBefore: string;
      renewalTime: string;
      revision: number;
    };
  };

const formatDuration = (duration: string) => {
  const match = duration.match(/(\d+)h/)
  if (match) {
    const hours = parseInt(match[1])
    const days = Math.floor(hours / 24)
    return `${days} days`
  }
  return duration
}

const CertificateCard = ({ certificate }: { certificate: CertificateType }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isReady = certificate.status.conditions.some(
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
              <Certificate className="h-5 w-5" />
              {certificate.metadata.name}
            </CardTitle>
            <CardDescription>Namespace: {certificate.metadata.namespace}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HandCoinsIcon className="h-4 w-4" />
                <span className="text-sm">Issuer: {certificate.spec.issuerRef.name} ({certificate.spec.issuerRef.kind})</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Expires: {formatDistanceToNow(new Date(certificate.status.notAfter), { addSuffix: true })}
                </span>
              </div>
              <Badge variant={isReady ? "success" : "destructive"} className="mt-2">
                {isReady ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                {isReady ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{certificate.metadata.name}</DialogTitle>
          <DialogDescription>Namespace: {certificate.metadata.namespace}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Certificate className="h-5 w-5" /> Certificate Details
              </h3>
              <div className="ml-4 mt-2 space-y-2">
                {certificate.spec.commonName && (
                  <p><span className="font-medium">Common Name:</span> {certificate.spec.commonName}</p>
                )}
                <div>
                  <p className="font-medium">DNS Names:</p>
                  <ul className="list-disc list-inside">
                    {certificate.spec.dnsNames.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                </div>
                {certificate.spec.usages && (
                  <div>
                    <p className="font-medium">Usages:</p>
                    <ul className="list-disc list-inside">
                      {certificate.spec.usages.map((usage, index) => (
                        <li key={index}>{usage}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HandCoinsIcon className="h-5 w-5" /> Issuer
              </h3>
              <div className="ml-4 mt-2">
                <p><span className="font-medium">Kind:</span> {certificate.spec.issuerRef.kind}</p>
                <p><span className="font-medium">Name:</span> {certificate.spec.issuerRef.name}</p>
                {certificate.spec.issuerRef.group && (
                  <p><span className="font-medium">Group:</span> {certificate.spec.issuerRef.group}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timing
              </h3>
              <div className="ml-4 mt-2 space-y-1">
                {certificate.spec.duration && <p><span className="font-medium">Duration:</span> {formatDuration(certificate.spec.duration)}</p>}
                {certificate.spec.renewBefore && <p><span className="font-medium">Renew Before:</span> {formatDuration(certificate.spec.renewBefore)}</p>}
                <p><span className="font-medium">Not Before:</span> {format(new Date(certificate.status.notBefore), 'PPpp')}</p>
                <p><span className="font-medium">Not After:</span> {format(new Date(certificate.status.notAfter), 'PPpp')}</p>
                <p><span className="font-medium">Renewal Time:</span> {format(new Date(certificate.status.renewalTime), 'PPpp')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileKey className="h-5 w-5" /> Secret
              </h3>
              <div className="ml-4 mt-2">
                <p><span className="font-medium">Name:</span> {certificate.spec.secretName}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="h-5 w-5" /> Status
              </h3>
              <div className="ml-4 mt-2">
                {certificate.status.conditions.map((condition, index) => (
                  <div key={index} className="mb-4 p-3 border rounded">
                    <p className="font-medium flex items-center gap-2">
                      {condition.type}
                      <Badge variant={condition.status === 'True' ? 'success' : 'secondary'}>
                        {condition.status}
                      </Badge>
                    </p>
                    <p className="text-sm mt-1">{condition.message}</p>
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
                <p><span className="font-medium">UID:</span> {certificate.metadata.uid}</p>
                <p><span className="font-medium">Resource Version:</span> {certificate.metadata.resourceVersion}</p>
                <p><span className="font-medium">Generation:</span> {certificate.metadata.generation}</p>
                <p><span className="font-medium">Creation:</span> {format(new Date(certificate.metadata.creationTimestamp), 'PPpp')}</p>
              </div>
            </div>
            {certificate.metadata.ownerReferences && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" /> Owner References
                </h3>
                <div className="ml-4 mt-2">
                  {certificate.metadata.ownerReferences.map((owner, index) => (
                    <div key={index} className="mb-4 p-3 border rounded">
                      <p><span className="font-medium">Kind:</span> {owner.kind}</p>
                      <p><span className="font-medium">Name:</span> {owner.name}</p>
                      <p><span className="font-medium">Controller:</span> {owner.controller ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
  </Card>
)

export default function KubernetesCertificateList({items}:{items:CertificateType[]}) {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<CertificateType[]>([])

  // Simulate API call
  useEffect(() => {
      setCertificates(items)
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

  if (certificates.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle>No Certificates Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are currently no certificates in the cluster.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        {certificates.map((cert) => (
          <CertificateCard key={cert.metadata.uid} certificate={cert} />
        ))}
    </div>
  )
}


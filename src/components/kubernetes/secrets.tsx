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
import { Tag, Clock, FileText,FileKeyIcon } from 'lucide-react'
import { format } from 'date-fns'
import SmartDataViewer from '../queues/queueJob/SmartDataViewer'

export type SecretType = {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  type: string;
  data:Record<string,string>[],
};

const SecretCard = ({ secret }: { secret: SecretType }) => {
  const [isOpen, setIsOpen] = useState(false)

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
              <FileKeyIcon className="h-5 w-5" />
              {secret.metadata.name}
            </CardTitle>
            <CardDescription>Namespace: {secret.metadata.namespace}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Type: {secret.type}</span>
              </div>
              <Badge variant="secondary">
                {secret.metadata.labels?.["controller.cert-manager.io/fao"] === "true" ? "Cert-Manager Managed" : "User Managed"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{secret.metadata.name}</DialogTitle>
          <DialogDescription>Namespace: {secret.metadata.namespace}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileKeyIcon className="h-5 w-5" /> Secret Details
              </h3>
              <div className="ml-4 mt-2 space-y-1">
                <p><span className="font-medium">Type:</span> {secret.type}</p>
                <p><span className="font-medium">UID:</span> {secret.metadata.uid}</p>
                <p><span className="font-medium">Resource Version:</span> {secret.metadata.resourceVersion}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Labels
              </h3>
              <div className="ml-4 mt-2">
                {Object.entries(secret.metadata.labels || {}).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="mr-2 mb-2">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" /> Annotations
              </h3>
              <div className="ml-4 mt-2">
                {Object.entries(secret.metadata.annotations || {}).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    {key.endsWith("last-applied-configuration")?(
                        <SmartDataViewer label={key} data={JSON.parse(value)} />
                    ):(<>
                        <span className="font-medium">{key}:</span> {value}
                    </>)}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timestamps
              </h3>
              <div className="ml-4 mt-2">
                <p><span className="font-medium">Created:</span> {format(new Date(secret.metadata.creationTimestamp), 'PPpp')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Data
              </h3>
              <div className="ml-4 mt-2">
              {Object.entries(secret.data||{}).map(([key, value]) => (
                  <p key={key} className="flex gap-2">
                    <span className="font-medium">{key}</span>
                    <span>
                      <Badge variant="secondary">Encrypted</Badge>
                    </span>
                  </p>
                ))}
              </div>
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

export default function KubernetesSecretList({items}:{items:SecretType[]}) {
  const [loading, setLoading] = useState(true)
  const [secrets, setSecrets] = useState<SecretType[]>([])

  // Simulate API call
  useEffect(() => {
      setSecrets(items)
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

  if (secrets.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle>No Secrets Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are currently no TLS secrets in the cluster.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        {secrets.map((secret) => (
          <SecretCard key={secret.metadata.uid} secret={secret} />
        ))}
    </div>
  )
}




import React, { useContext, useState } from 'react'
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
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SecretsList } from '@/components/kubernetes/quick-view-resources/SecretsList'
import { format } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tag, Clock, FileKeyIcon } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import SmartDataViewer from '@/components/queues/queueJob/SmartDataViewer'

export default function SecretsPage() {
  const { selectedNamespace } = useContext(NamespaceContext)
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState({})

  const {
    resource: secrets,
    isLoading,
    error
  } = useKubernertesResources({ nameSpace: selectedNamespace, type: "secrets" })

  const filteredSecrets =
    secrets?.filter(
      (secret) =>
        secret.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];


  const handleView = async (data) => {
    setSelectedSecret(data.fullData)
    setShowDetails(true)
  }


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
              <FileKeyIcon className="h-4 w-4" />
              <h2>Secrets</h2>
            </div>
          }
          shortDescription="Manage your Kubernetes Secrets—create, edit, or delete sensitive data used by your applications."
          description="Secrets in Kubernetes are used to securely store and manage sensitive information such as passwords, tokens, SSH keys, and TLS certificates. Unlike ConfigMaps, Secrets are encoded and handled with tighter access controls to reduce the risk of exposure. They can be mounted into Pods as files or exposed as environment variables at runtime."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Secrets</CardTitle>
              <CardDescription>
                Secrets from {selectedNamespace || "All"} namespace
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />

              <Button>Create pods</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search secrets..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <SecretsList secrets={filteredSecrets} onView={handleView} />
          </CardContent>
        </Card>
      </div>
      {showDetails && Object.keys(selectedSecret).length && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedSecret.metadata.name}</DialogTitle>
              <DialogDescription>
                Namespace: {selectedSecret.metadata.namespace}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 p-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileKeyIcon className="h-5 w-5" /> Secret Details
                  </h3>
                  <div className="ml-4 mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedSecret.type}
                    </p>
                    <p>
                      <span className="font-medium">UID:</span>{" "}
                      {selectedSecret.metadata.uid}
                    </p>
                    <p>
                      <span className="font-medium">Resource Version:</span>{" "}
                      {selectedSecret.metadata.resourceVersion}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5" /> Labels
                  </h3>
                  <div className="ml-4 mt-2">
                    {Object.entries(selectedSecret.metadata.labels || {}).map(
                      ([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="mr-2 mb-2"
                        >
                          {key}: {value}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5" /> Annotations
                  </h3>
                  <div className="ml-4 mt-2">
                    {Object.entries(
                      selectedSecret.metadata.annotations || {}
                    ).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        {key.endsWith("last-applied-configuration") ? (
                          <SmartDataViewer
                            label={key}
                            data={JSON.parse(value)}
                          />
                        ) : (
                          <>
                            <span className="font-medium">{key}:</span> {value}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Timestamps
                  </h3>
                  <div className="ml-4 mt-2">
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {format(
                        new Date(selectedSecret.metadata.creationTimestamp),
                        "PPpp"
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Data
                  </h3>
                  <div className="ml-4 mt-2">
                    {Object.entries(selectedSecret.data || {}).map(
                      ([key, value]) => (
                        <p key={key} className="flex gap-2">
                          <span className="font-medium">{key}</span>
                          <span>
                            <Badge variant="secondary">Encrypted</Badge>
                          </span>
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
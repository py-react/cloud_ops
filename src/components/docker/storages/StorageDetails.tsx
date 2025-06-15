import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import type { StorageInfo } from '@/types/storage'

interface StorageDetailsProps {
  storage: StorageInfo;
}

export function StorageDetails({ storage }: StorageDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className='w-[50%]'>
            <CardTitle className='truncate w-full'>{storage.name}</CardTitle>
            <CardDescription>
              Created {format(new Date(storage.created), 'PPpp')}
            </CardDescription>
          </div>
          <Badge variant={storage.inUse ? "default" : "secondary"}>
            {storage.inUse ? "In Use" : "Not In Use"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Driver</h4>
              <p className="text-sm text-muted-foreground">{storage.driver}</p>
            </div>

            {storage.mountPoint && (
              <div>
                <h4 className="text-sm font-medium">Mount Point</h4>
                <p className="text-sm text-muted-foreground">{storage.mountPoint}</p>
              </div>
            )}

            {storage.scope && (
              <div>
                <h4 className="text-sm font-medium">Scope</h4>
                <p className="text-sm text-muted-foreground">{storage.scope}</p>
              </div>
            )}

            {storage.options && (
              <div>
                <h4 className="text-sm font-medium">Options</h4>
                <p className="text-sm text-muted-foreground">{storage.options}</p>
              </div>
            )}

            {Object.keys(storage.labels || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Labels</h4>
                <div className="mt-2 space-y-2">
                  {Object.entries(storage.labels || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{key}:</span>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 
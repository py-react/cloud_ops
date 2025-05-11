import React from "react";
import { Network } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { X, Globe2, Settings, Tag, Network as NetworkIcon, Calendar } from 'lucide-react';

interface NetworkModalProps {
  network: Network | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NetworkModal({ network, open, onOpenChange }: NetworkModalProps) {
  if (!network) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 pr-8">
              <NetworkIcon className="h-5 w-5 text-primary" />
              <DialogTitle className="text-2xl break-all">{network.Name}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-8 pr-4">
            <section>
              <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <Settings className="h-5 w-5" />
                <h3>Basic Information</h3>
              </div>
              <div className="grid gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="font-mono text-sm truncate" title={network.Id}>{network.Id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{format(new Date(network.Created), 'PPP pp')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    <span>{network.Scope}</span>
                  </div>
                  <Badge variant="outline">{network.Driver}</Badge>
                  {network.EnableIPv6 && <Badge>IPv6 Enabled</Badge>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <Settings className="h-5 w-5" />
                <h3>Network Configuration</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex flex-wrap gap-2">
                    <Badge variant={network.Internal ? "default" : "secondary"} className="h-7">
                      {network.Internal ? "Internal" : "External"}
                    </Badge>
                    <Badge variant={network.Attachable ? "default" : "secondary"} className="h-7">
                      {network.Attachable ? "Attachable" : "Non-Attachable"}
                    </Badge>
                    <Badge variant={network.Ingress ? "default" : "secondary"} className="h-7">
                      {network.Ingress ? "Ingress" : "Non-Ingress"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-3">IPAM Configuration</h4>
                  <div className="space-y-3">
                    {network.IPAM.Config.map((config, index) => (
                      <div key={index} className="p-3 bg-background rounded-md">
                        <div className="grid gap-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Subnet</label>
                            <p className="font-mono text-sm">{config.Subnet}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Gateway</label>
                            <p className="font-mono text-sm">{config.Gateway}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {Object.keys(network.Labels).length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
                  <Tag className="h-5 w-5" />
                  <h3>Labels</h3>
                </div>
                <div className="grid gap-3">
                  {Object.entries(network.Labels).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 p-3 rounded-lg">
                      <label className="text-sm font-medium text-muted-foreground block mb-1">{key}</label>
                      <p className="text-sm bg-background p-2 rounded">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
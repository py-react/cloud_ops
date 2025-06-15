import React from "react";
import { Network } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { 
  Network as NetworkIcon, 
  Info, 
  Settings, 
  Server, 
  Tag, 
  List, 
  Globe, 
  Shield, 
  Link, 
  Lock, 
  Wifi, 
  CheckCircle2, 
  XCircle,
  Database,
  Sliders,
  KeyRound,
} from "lucide-react";

interface NetworkDetailsProps {
  network: Network;
}

export function NetworkDetails({ network }: NetworkDetailsProps) {
  return (
    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
      <div className="space-y-8 p-2">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <NetworkIcon className="h-6 w-6 text-primary" />
            <h3 className="text-base font-medium text-muted-foreground">Basic Information</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground mt-1">{network.Name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">ID</p>
                <p className="text-sm text-muted-foreground mt-1">{network.Id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Driver</p>
                <p className="text-sm text-muted-foreground mt-1">{network.Driver}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Scope</p>
                <p className="text-sm text-muted-foreground mt-1">{network.Scope}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <List className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground mt-1">{format(new Date(network.Created), 'PPP')}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-6 w-6 text-primary" />
            <h3 className="text-base font-medium text-muted-foreground">Configuration</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Internal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {network.Internal ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Link className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Attachable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {network.Attachable ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Ingress</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {network.Ingress ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wifi className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Enable IPv6</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {network.EnableIPv6 ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div>
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-6 w-6 text-primary" />
            <h3 className="text-base font-medium text-muted-foreground">IPAM Configuration</h3>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Driver</p>
                <p className="text-sm text-muted-foreground mt-1">{network.IPAM.Driver}</p>
              </div>
            </div>
            {network.IPAM.Config && network.IPAM.Config.length > 0 && (
              <div className="flex items-start gap-3">
                <Sliders className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Config</p>
                  <div className="mt-2 space-y-2">
                    {network.IPAM.Config.map((config, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {Object.entries(config).map(([key, value]) => (
                          <p key={key}>{`${key}: ${value}`}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {Object.keys(network.Labels).length > 0 && (
          <>
            <Separator className="my-2" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-6 w-6 text-primary" />
                <h3 className="text-base font-medium text-muted-foreground">Labels</h3>
              </div>
              <div className="mt-4 space-y-3">
                {Object.entries(network.Labels).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground mt-1" />
                    <p className="text-sm text-muted-foreground">
                      {`${key}: ${value}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {Object.keys(network.Options).length > 0 && (
          <>
            <Separator className="my-2" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sliders className="h-6 w-6 text-primary" />
                <h3 className="text-base font-medium text-muted-foreground">Options</h3>
              </div>
              <div className="mt-4 space-y-3">
                {Object.entries(network.Options).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground mt-1" />
                    <p className="text-sm text-muted-foreground">
                      {`${key}: ${value}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
} 
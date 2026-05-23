import React from "react";
import { ShieldAlert, ArrowRight, Terminal, CloudOff, FileCode, Shield, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import useNavigate from "@/libs/navigate";
import { Card, CardContent } from "@/components/ui/card";

interface KubeErrorStateProps {
  error: string;
  isConfigMissing?: boolean;
}

export function KubeErrorState({ error, isConfigMissing }: KubeErrorStateProps) {
  const navigate = useNavigate();

  if (!isConfigMissing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive mb-4 border border-destructive/20">
          <CloudOff className="h-8 w-8" />
        </div>
        <h2 className="text-sm font-black uppercase tracking-tight text-foreground mb-1">Connection Failure</h2>
        <p className="text-[11px] font-medium text-muted-foreground max-w-md mx-auto mb-6">
          {error || "We encountered an unexpected error while communicating with the Kubernetes API."}
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="h-8 text-[10px] font-black uppercase tracking-widest"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-120px)] w-full animate-in fade-in duration-500">
      <Card className="w-full max-w-3xl border-border/50 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
        {/* Header styling matching the platform */}
        <div className="border-b border-border/40 bg-muted/5 p-6 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Network className="h-10 w-10" />
            </div>
            <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white shadow-sm ring-2 ring-background">
              <ShieldAlert className="h-3 w-3" />
            </div>
          </div>
          
          <h1 className="text-lg font-bold tracking-tight text-foreground mb-2">
            Cluster Disconnected
          </h1>
          <p className="text-[13px] text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            The platform requires an active <code className="px-1.5 py-0.5 rounded bg-muted/50 font-mono text-primary font-bold">Kubeconfig</code> to orchestrate your resources. No valid configuration was found in the secure vault.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button 
              onClick={() => navigate("/settings/kubernetes/configs")}
              className="h-10 px-6 text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              Initialize Configuration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="h-10 px-6 text-xs font-bold uppercase tracking-widest bg-white/50"
            >
              Dashboard
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40 bg-muted/5">
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <FileCode className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground mb-1">Standard YAML</h3>
                <p className="text-[13px] text-muted-foreground font-medium">Upload your existing config file from Cloud providers or local clusters.</p>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground mb-1">Zero Fallback</h3>
                <p className="text-[13px] text-muted-foreground font-medium">Platform-wide policy ensures no local filesystem leakage. Secure access only.</p>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground mb-1">RBAC Ready</h3>
                <p className="text-[13px] text-muted-foreground font-medium">Configured contexts are mapped to platform users for granular auditing.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

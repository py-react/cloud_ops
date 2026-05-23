import React, { useState, useEffect } from "react";
import { ShieldAlert, ArrowRight, ServerOff, Terminal, Cog, Search, Settings, Loader2, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import useNavigate from "@/libs/navigate";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface DockerErrorStateProps {
  error: string;
}

export function DockerErrorState({ error }: DockerErrorStateProps) {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    fetch('/api/system/install?tool=docker')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setIsInstalled(data.is_installed);
      })
      .catch(() => {});
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    toast.info("Installation started in the background. Please wait...");
    try {
      const res = await fetch('/api/system/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'docker' })
      });
      const data = await res.json();
      if (!data.error) {
        // Poll for installation success
        const interval = setInterval(async () => {
          try {
            const checkRes = await fetch('/api/system/install?tool=docker');
            const checkData = await checkRes.json();
            if (checkData.is_installed) {
              clearInterval(interval);
              toast.success("Docker installed successfully!");
              window.location.reload();
            }
          } catch (err) {}
        }, 5000);
      } else {
        toast.error(data.message);
        setIsInstalling(false);
      }
    } catch (e) {
      toast.error("Installation request failed");
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-120px)] w-full animate-in fade-in duration-500">
      <Card className="w-full max-w-3xl border-border/50 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
        {/* Header styling matching the platform */}
        <div className="border-b border-border/40 bg-muted/5 p-6 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <ServerOff className="h-10 w-10" />
            </div>
            <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white shadow-sm ring-2 ring-background">
              <ShieldAlert className="h-3 w-3" />
            </div>
          </div>
          
          <h1 className="text-lg font-bold tracking-tight text-foreground mb-2">
            Docker Engine Disconnected
          </h1>
          <p className="text-[13px] text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            The platform requires an active <code className="px-1.5 py-0.5 rounded bg-muted/50 font-mono text-blue-600 font-bold">Docker Daemon</code> to orchestrate containers. No active engine configuration was found or the socket is unreachable.
          </p>

          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-md">
             <p className="text-xs font-mono text-red-600 font-medium">Error: {error}</p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {isInstalled === false && (
              <Button 
                onClick={handleInstall}
                disabled={isInstalling}
                className="h-10 px-6 text-xs font-bold uppercase tracking-widest shadow-sm bg-blue-600 hover:bg-blue-700"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Install Docker Now
                  </>
                )}
              </Button>
            )}
            
            {isInstalled !== false && (
              <Button 
                onClick={() => navigate("/settings/docker/config")}
                disabled={isInstalling}
                className="h-10 px-6 text-xs font-bold uppercase tracking-widest shadow-sm bg-blue-600 hover:bg-blue-700"
              >
                Configure Engine
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={isInstalling}
              className="h-10 px-6 text-xs font-bold uppercase tracking-widest bg-white/50"
            >
              Retry Connection
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40 bg-muted/5">
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-1">Local Socket</h3>
                <p className="text-[13px] text-muted-foreground font-medium">By default, the platform looks for unix:///var/run/docker.sock on the host system.</p>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-1">Remote TCP</h3>
                <p className="text-[13px] text-muted-foreground font-medium">You can configure remote Docker engines via TCP using TLS certificates.</p>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-3 hover:bg-muted/10 transition-colors">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-1">DIND Setup</h3>
                <p className="text-[13px] text-muted-foreground font-medium">If running inside a container, ensure the Docker socket is mounted as a volume.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useEffect, useState, useContext } from "react";
import { NetworkList } from "@/components/docker/network/NetworkList";
import { Network as NetworkIcon, Search, RefreshCw, ShieldCheck, Globe, Activity } from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DefaultService, NetworkInfo } from '@/gingerJs_api_client';
import { DockerErrorState } from "@/components/docker/DockerErrorState";
import PageLayout from "@/components/PageLayout";

// Context & Selector
import { DockerEngineContext } from "@/components/docker/contextProvider/DockerEngineContext";
import { DockerEngineSelector } from "@/components/docker/DockerEngineSelector";

const fetchNetworks = async () => {
  const response = await DefaultService.apiDockerNetworksGet();
  return response.items;
};

const deleteNetwork = async (id: string): Promise<void> => {
  await DefaultService.apiDockerNetworksDelete({ requestBody: { network_id: id } });
};

export default function NetworkPage() {
  const { activeEngineId } = useContext(DockerEngineContext);

  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const getNetworks = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const statusRes = await DefaultService.apiDockerSystemsPost({ requestBody: { action: 'status' } }) as any;
      if (statusRes.error) {
         setGlobalError(statusRes.message || "Docker Engine Disconnected");
         setLoading(false);
         return;
      }
      const items = await fetchNetworks();
      setNetworks(items);
    } catch (error) {
      toast.error("Failed to fetch networks");
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever activeEngineId changes
  useEffect(() => {
    if (activeEngineId !== null) {
      getNetworks();
    }
  }, [activeEngineId]);

  const filteredNetworks = networks.filter(
    (network) =>
      network.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteNetwork(id);
      await getNetworks();
      toast.success('Network deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete network');
      return false;
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    try {
      const promises = selected.map(s => deleteNetwork(s.network.Id));
      await Promise.all(promises);
      toast.success(`${selected.length} networks deleted successfully`);
      await getNetworks();
    } catch (err: any) {
      toast.error('Failed to delete some networks');
    }
  };

  const stats = {
    total: networks.length,
    bridge: networks.filter(n => n.Driver === 'bridge').length,
    overlay: networks.filter(n => n.Driver === 'overlay').length,
    other: networks.filter(n => n.Driver !== 'bridge' && n.Driver !== 'overlay').length,
  };

  return (
    <PageLayout
      title="Networks"
      subtitle="Configure Docker virtual networks."
      icon={NetworkIcon}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <DockerEngineSelector />
          <Button variant="outline" onClick={getNetworks}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      {globalError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Active Engine Connection Error:</span> {globalError}
            <p className="text-xs text-muted-foreground mt-0.5">Please check if the Docker engine is running or select another engine context.</p>
          </div>
        </div>
      )}

      {/* Hero Stats Section */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
        <ResourceCard
          title="Total"
          count={stats.total}
          icon={<NetworkIcon className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Bridge"
          count={stats.bridge}
          icon={<ShieldCheck className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={loading}
        />
        <ResourceCard
          title="Overlay"
          count={stats.overlay}
          icon={<Globe className="w-4 h-4" />}
          color="bg-blue-500"
          className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          isLoading={loading}
        />
      </div>

      {!globalError && (
        <NetworkList
          networks={filteredNetworks}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          title="Network Registry"
          description="Virtual network segment configuration and driver management"
          icon={<NetworkIcon className="w-5 h-5 text-primary" />}
          extraHeaderContent={
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search networks..."
                className="pl-9 h-9 bg-background/50 border-border/50 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />
      )}
    </PageLayout>
  );
}

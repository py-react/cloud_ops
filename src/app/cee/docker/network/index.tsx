import React, { useEffect, useState } from "react";
import { NetworkList } from "@/components/docker/network/NetworkList";
import { CreateNetworkForm } from "@/components/docker/network/forms/CreateNetworkForm";
import { Network as NetworkIcon, Search, RefreshCw, Plus, ShieldCheck, Globe } from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import RouteDescription from "@/components/route-description";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DefaultService, NetworkInfo } from '@/gingerJs_api_client';

const fetchNetworks = async () => {
  const response = await DefaultService.apiDockerNetworksGet();
  return response.items;
};

const deleteNetwork = async (id: string): Promise<void> => {
  await DefaultService.apiDockerNetworksDelete({ requestBody: { network_id: id } });
};

const createNetwork = async (data: any): Promise<void> => {
  await DefaultService.apiDockerNetworksPost({
    requestBody: {
      name: data.name,
      driver: data.driver,
      scope: data.scope,
      options: data.options,
      ipam: data.ipam,
      check_duplicate: data.check_duplicate,
      internal: data.internal,
      labels: data.labels,
      enable_ipv6: data.enable_ipv6,
      attachable: data.attachable,
      ingress: data.ingress
    }
  });
};

export default function NetworkPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const getNetworks = async () => {
    setLoading(true);
    try {
      const items = await fetchNetworks();
      setNetworks(items);
    } catch (error) {
      toast.error("Failed to fetch networks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNetworks();
  }, []);

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

  const handleCreateNetwork = async (data: any) => {
    try {
      await createNetwork(data);
      toast.success('Network created successfully');
      await getNetworks();
      setShowCreate(false);
    } catch (error) {
      toast.error('Failed to create network');
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
    <>
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
        {/* Page Header */}
        <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-b border-border/100 pb-2 mb-2">
          <div>
            <div className="flex items-center gap-4 mb-1 p-1">
              <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <NetworkIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Networks</h1>
                <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-0 mt-2">
                  Configure Docker virtual networks.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" onClick={getNetworks}>
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Refresh
            </Button>
            <Button variant="gradient" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create
            </Button>
          </div>
        </div>

        {/* Hero Stats Section */}
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total"
            count={stats.total}
            icon={<NetworkIcon className="w-4 h-4" />}
            color="bg-primary"
            className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          />
          <ResourceCard
            title="Bridge"
            count={stats.bridge}
            icon={<ShieldCheck className="w-4 h-4" />}
            color="bg-emerald-500"
            className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          />
          <ResourceCard
            title="Overlay"
            count={stats.overlay}
            icon={<Globe className="w-4 h-4" />}
            color="bg-blue-500"
            className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          />
        </div>


        <div className="flex-1 min-h-0 mt-10">
          <NetworkList
            networks={filteredNetworks}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            title="Network Registry"
            description="Virtual network segment configuration and driver management"
            icon={<NetworkIcon className="h-4 w-4" />}
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
        </div>
      </div>
      <CreateNetworkForm
        isWizardOpen={showCreate}
        setIsWizardOpen={setShowCreate}
        onSubmit={handleCreateNetwork}
        onCancel={() => setShowCreate(false)}
      />
    </>
  );
}

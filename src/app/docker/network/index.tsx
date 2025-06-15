import React, { useEffect, useState } from 'react';
import { Network } from '@/components/network/types';
import { NetworkList } from '@/components/network/NetworkList';
import { CreateNetworkForm } from '@/components/network/forms/CreateNetworkForm';
import { Network as NetworkIcon, Search } from 'lucide-react';
import { DefaultService, NetworkListResponse } from '@/gingerJs_api_client';
import RouteDescription from '@/components/route-description';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditNetworkForm } from '@/components/network/forms/EditNetworkForm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fetchNetworks = async () => {
  const response = await DefaultService.apiNetworksGet();
  return response.items;
};

const deleteNetwork = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    DefaultService.apiNetworksDelete({ requestBody: { network_id: id } })
      .then(() => {
        resolve();
      })
      .catch((err: Error) => {
        reject(err);
      });
  });
};

const createNetwork = async (data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    DefaultService.apiNetworksPost({ requestBody: {
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
    }})
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const patchNetwork = async (data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    DefaultService.apiNetworksPut({ requestBody: {
      network_id:data.network_id,
      name: data.name,
      driver: data.driver,
      scope: data.scope,
      options: data.options,
      ipam: data.ipam,
      internal: data.internal,
      labels: data.labels,
      enable_ipv6: data.enable_ipv6,
      attachable: data.attachable,
      ingress: data.ingress
    }})
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export default function NetworkPage() {
  const [networks, setNetworks] = useState<NetworkListResponse["items"]>([]);
  const [currentNetworkToEdit,setCurrentNetworkToEdit] = useState(undefined)
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit,setShowEdit] = useState(false)

  const getnetworks = async() => {
    const items = await fetchNetworks()
    setNetworks(items);
  }

  useEffect(() => {
    getnetworks()
  }, [])

  const filteredNetworks = networks.filter(
    (network) =>
      network.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteNetwork(id);
      await getnetworks();
      return true;
    } catch (error) {
      console.error('Failed to delete network:', error);
      return false;
    }
  };

  const handlePatchNetwork = async (data: any) => {
    try {
      await patchNetwork({
        network_id: currentNetworkToEdit?.network?.Id,
        ...data,
      });
      toast.success('Network created successfully');
      await getnetworks();
      setShowEdit(false);
    } catch (error) {
      console.error('Failed to create network:', error);
      toast.error('Failed to create network');
    }
  };

  const handleCreateNetwork = async (data: any) => {
    try {
      await createNetwork(data);
      toast.success('Network created successfully');
      await getnetworks();
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create network:', error);
      toast.error('Failed to create network');
    }
  };

  return (
    <div className='w-full'>
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <NetworkIcon className='h-4 w-4'/>
              <h2>Networks</h2>
            </div>
          }
          shortDescription='Manage Docker networks—create, inspect, or remove networks used for container communication.'
          description='Docker networks enable isolated and structured communication between containers, both on the same host and across multiple hosts. They abstract away low-level networking, allowing containers to discover and connect to each other using network names. Docker supports several built-in network drivers like bridge, host, and overlay, each serving different use cases.'
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Networks</CardTitle>
              <CardDescription>
                {networks.length} networks found
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <NetworkIcon className="mr-2 h-4 w-4" />
              Create Network
            </Button>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <div className="relative px-6">
              <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search networks..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <NetworkList networks={filteredNetworks} onDelete={handleDelete} onEdit={(data)=>{
              setCurrentNetworkToEdit(data)
              setShowEdit(true)
            }} />
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <NetworkIcon className="h-5 w-5" />
              Create Network
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <CreateNetworkForm
              onSubmit={handleCreateNetwork}
              onCancel={() => {
                setShowCreate(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent className="max-w-none w-screen h-screen p-0">
            <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
              <DialogTitle className="flex items-center gap-2 w-full px-6">
                <NetworkIcon className="h-5 w-5" />
                Patch Network
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-[calc(100vh-8rem)] px-6">
              <EditNetworkForm
                network={currentNetworkToEdit?.network}
                onSubmit={handlePatchNetwork}
                onCancel={() => {
                  setShowEdit(false);
                  setCurrentNetworkToEdit(undefined);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

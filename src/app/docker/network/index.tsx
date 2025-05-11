import React,{ useEffect, useState } from 'react';
import { Network } from '@/components/network/types';
import { NetworkCard } from '@/components/network/NetworkCard';
import { NetworkModal } from '@/components/network/NetworkModal';
import { Activity, Network as NetworkIcon } from 'lucide-react';
import { DefaultService } from '@/gingerJs_api_client';


// Mock delete function since we don't have actual Docker API integration
const deleteNetwork = async (id: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Network deleted:', id);
        resolve(true);
      }, 1000);
    });
  };

  const fetchNetworks = async () => {

    return new Promise(async (resolve) => {
      const response = await DefaultService.apiNetworksGet()
      resolve(response.items);
    });
  };

  export default function App() {
    const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [networks,setNetworks] = useState<Network[]>([]);

    const getnetworks = async()=>{
        const items = await fetchNetworks()
        setNetworks(items);
    }
    useEffect(()=>{
        getnetworks()
    },[])

  
    return (
      <div className="network">
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold ">Networks</h1>
          {networks.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span>{networks.length} networks found</span>
            </div>
          )}
          <div className="mb-6 flex items-center gap-2 w-full">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center px-4 py-2 border border-transparent 
                            text-sm font-medium rounded-md text-white bg-gray-600 
                            hover:bg-gray-700 focus:outline-none focus:ring-2 
                            focus:ring-offset-2 focus:ring-gray-500"
              >
                Create Network
              </button>
            </div>
          </div>
          <div className="space-y-3 ">
            {networks.map((network) => (
              <NetworkCard
                key={network.Id}
                network={network}
                onClick={() => {
                  setSelectedNetwork(network);
                  setIsModalOpen(true);
                }}
                onDelete={deleteNetwork}
              />
            ))}
          </div>
        </div>

        <NetworkModal
          network={selectedNetwork}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </div>
    );
  }
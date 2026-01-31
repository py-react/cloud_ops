import React, { useEffect, useState } from "react";
import { StorageInfo } from "@/types/storage";
import { StoragesList } from "@/components/docker/storages/StoragesList";
import { CreateStorageForm } from "@/components/docker/storages/forms/CreateStorageForm";
import { HardDrive, Search, RefreshCw, Plus, Database, Trash2 } from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DefaultService } from '@/gingerJs_api_client';
import { VolumeActionRequest } from '@/gingerJs_api_client/models/VolumeActionRequest';
import PageLayout from "@/components/PageLayout";

const fetchStorages = async () => {
  const response = await DefaultService.apiDockerStoragesGet();
  return (response as { storages: StorageInfo[] }).storages;
};

const deleteStorage = async (id: string): Promise<void> => {
  const request: VolumeActionRequest = {
    action: "remove",
    volume_id: id
  };
  await DefaultService.apiDockerStoragesPost({ requestBody: request });
};

const createStorage = async (data: any): Promise<void> => {
  const transformedData = {
    name: data.name,
    driver: data.driver,
    driverOpts: data.driver_opts || {},
    labels: data.labels || {}
  };

  const request: VolumeActionRequest = {
    action: "add",
    add_data: transformedData
  };
  await DefaultService.apiDockerStoragesPost({ requestBody: request });
};

export default function StoragePage() {
  const [storages, setStorages] = useState<StorageInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const getStorages = async () => {
    const items = await fetchStorages();
    setStorages(items);
  };

  useEffect(() => {
    getStorages();
  }, []);

  const filteredStorages = storages.filter(
    (storage) =>
      storage.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteStorage(id);
      await getStorages();
      toast.success('Storage deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete storage:', error);
      toast.error('Failed to delete storage');
      return false;
    }
  };

  const handleCreateStorage = async (data: any) => {
    try {
      await createStorage(data);
      toast.success('Storage created successfully');
      await getStorages();
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create storage:', error);
      toast.error('Failed to create storage');
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    try {
      const promises = selected.map(s => deleteStorage(s.storage.name));
      await Promise.all(promises);
      toast.success(`${selected.length} volumes deleted successfully`);
      await getStorages();
    } catch (err: any) {
      toast.error('Failed to delete some volumes');
    }
  };

  const stats = {
    total: storages.length,
    local: storages.filter(s => s.driver === 'local').length,
    other: storages.filter(s => s.driver !== 'local').length,
  };

  return (
    <PageLayout
      title="Storages"
      subtitle="Managed persistent storage units and volumes."
      icon={HardDrive}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={getStorages}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button variant="default" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create
          </Button>
        </div>
      }
    >
      {/* Hero Stats Section */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
        <ResourceCard
          title="Total"
          count={stats.total}
          icon={<HardDrive className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
        />
        <ResourceCard
          title="Local"
          count={stats.local}
          icon={<Database className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
        />
        <ResourceCard
          title="Others"
          count={stats.other}
          icon={<Trash2 className="w-4 h-4" />}
          color="bg-orange-500"
          className="border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all"
        />
      </div>

      <div className="flex-1 min-h-0 mt-4">
        <StoragesList
          storages={filteredStorages}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          title="Volume Registry"
          description="Managed persistent storage units and volume driver configuration"
          icon={<HardDrive className="h-4 w-4" />}
          extraHeaderContent={
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search volumes..."
                className="pl-9 h-9 bg-background/50 border-border/50 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />
      </div>

      <CreateStorageForm
        isWizardOpen={showCreate}
        setIsWizardOpen={setShowCreate}
        onSubmit={handleCreateStorage}
        onCancel={() => setShowCreate(false)}
      />
    </PageLayout>
  );
}

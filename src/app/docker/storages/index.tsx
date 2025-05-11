import React, { useEffect, useState } from "react";
import useAutoRefresh from "@/components/containers/hooks/useAutoRefresh";
import { Loader, Plus } from "lucide-react";
import { StoragesList } from "@/components/storages/StoragesList";
import { toast } from "sonner";
import { CreateStorageModal } from "@/components/storages/CreateStorageModal";
import { StorageInfo } from "@/types/storage";


const fetchStorages = async () => {
  // Simulating an API call
  return new Promise(async (resolve) => {
    const storagesResponse = await fetch("/api/storages", { method: "GET" });
    const storages = (await storagesResponse.json()).storages;
    resolve(storages);
  });
};

const ContainerListPage = ({ storageInfo }:{storageInfo:StorageInfo[]}) => {
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storages, setStorages] = useState<StorageInfo[]>(storageInfo||[]);

  // const {
  //   data,
  //   isFetching,
  //   error,
  // } = useAutoRefresh(fetchStorages, 1500);

  // useEffect(() => {
  //   if (data) {
  //     setStorages(data);
  //   }
  // }, [data]);

  useEffect(() => {
    if (storageInfo) {
      setStorages(storageInfo);
    }
  }, [storageInfo]);

  return (
    <div key="storage">
      <div className="mb-2 flex items-center w-full gap-2 h-4 text-sm">
        {false && (
          <>
            <Loader className="w-3.5 h-3.5" />
            <span>Refreshing</span>
          </>
        )}
      </div>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Storages</h1>
        <div className="mb-2 flex justify-start">
          <button
            type="button"
            onClick={() => setShowStorageModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                          text-sm font-medium rounded-md text-white bg-gray-600 
                          hover:bg-gray-700 focus:outline-none focus:ring-2 
                          focus:ring-offset-2 focus:ring-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Storage
          </button>
        </div>
        <StoragesList storages={storages} setStorages={setStorages} />
      </div>
      <CreateStorageModal
        open={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onSubmit={async (storageCreationData) => {
          const reasponse = await fetch("/api/storages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add",
              add_data: storageCreationData,
            }),
          });

          const responseData = await reasponse.json();
          if (responseData.error) {
            toast.error(responseData.message);
            return;
          }
          setShowStorageModal(false);
          toast.success(responseData.message);
          setStorages((prev) => {
            return [responseData.volume, ...prev];
          });
        }}
      />
    </div>
  );
};

export default ContainerListPage;

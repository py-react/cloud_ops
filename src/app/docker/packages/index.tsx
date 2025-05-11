import React, { useEffect, useState } from "react";
import useAutoRefresh from "@/components/containers/hooks/useAutoRefresh";
import { ArrowDownToLineIcon, ContainerIcon, Loader } from "lucide-react";
import { PackagesList } from "@/components/packages/PackagesList";
import { toast } from "sonner";
import { PackageRunnerModal } from "@/components/packages/runner/PackageRunnerModal";
import { PackageCreatorModal } from "@/components/packages/runner/CreatePackageModal";
import { PackageInfo } from "@/types/package";

const fetchPackages = async () => {
  // Simulating an API call
  return new Promise(async (resolve) => {
    const packagesResponse = await fetch("/api/packges", { method: "GET" });
    const packages = (await packagesResponse.json()).packages;
    resolve(packages);
  });
};

const ContainerListPage= ({ packageInfo }:{packageInfo:PackageInfo[]}) => {
  const [showPackagePullModal, setShowPackagePullModal] = useState(false);
  const [showPackageCreateModal, setShowPackageCreateModal] = useState(false);

  const [packages, setPackages] = useState<PackageInfo[]>(packageInfo||[]);
  const { data, isFetching, error } = useAutoRefresh(fetchPackages, 1500);

  useEffect(() => {
    if (data) {
      setPackages(data);
    }
  }, [data]);

  useEffect(() => {
    if (packageInfo) {
      setPackages(packageInfo);
    }
  }, [packageInfo]);

  return (
    <div key="packages">
      <div className="mb-2 flex items-center w-full gap-2 h-4 text-sm">
        {isFetching && (
          <>
            <Loader className="w-3.5 h-3.5" />
            <span>Refreshing</span>
          </>
        )}
      </div>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Packages</h1>
        <div className="flex items-center gap-2 w-full">
          <div className="mb-2 flex justify-start">
            <button
              type="button"
              onClick={() => setShowPackagePullModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent 
                            text-sm font-medium rounded-md text-white bg-gray-600 
                            hover:bg-gray-700 focus:outline-none focus:ring-2 
                            focus:ring-offset-2 focus:ring-gray-500"
            >
              <ArrowDownToLineIcon className="w-4 h-4 mr-2" />
              Pull package
            </button>
          </div>
          <div className="mb-2 flex justify-start">
            <button
              type="button"
              onClick={() => setShowPackageCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent 
                            text-sm font-medium rounded-md text-white bg-gray-600 
                            hover:bg-gray-700 focus:outline-none focus:ring-2 
                            focus:ring-offset-2 focus:ring-gray-500"
            >
              <ContainerIcon className="w-4 h-4 mr-2" />
              Create package
            </button>
          </div>
        </div>
        <PackagesList packages={packages} setPackages={setPackages} />
      </div>
      <PackageRunnerModal
        open={showPackagePullModal}
        onClose={() => setShowPackagePullModal(false)}
        onSubmit={async (pullPackageInfo) => {
          const reasponse = await fetch("/api/packges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "pull",
              pull_config: {
                image: pullPackageInfo.image,
                registry: pullPackageInfo.registry,
              },
            }),
          });

          const responseData = await reasponse.json();
          if (responseData.error) {
            toast.error(responseData.message);
            return;
          }
          setShowPackagePullModal(false);
          toast.success(responseData.message);
        }}
      />
      <PackageCreatorModal
        onSubmit={async (data) => {
          const reasponse = await fetch("/api/packges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              create_config: data,
            }),
          });

          const responseData = await reasponse.json();
          if (responseData.error) {
            toast.error(responseData.message);
            return;
          }
          setShowPackageCreateModal(false);
          toast.success(responseData.message);
        }}
        open={showPackageCreateModal}
        onClose={() => setShowPackageCreateModal(false)}
      />
    </div>
  );
};

export default ContainerListPage;

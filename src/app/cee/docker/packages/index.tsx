import React, { useEffect, useState } from "react";
import { ArrowDownToLineIcon, ContainerIcon } from "lucide-react";
import { PackagesList } from "@/components/docker/packages/PackagesList";
import { toast } from "sonner";
import { PackageInfo } from "@/types/package";
import { PackageTableData } from '@/components/docker/packages/PackagesList';
import { DefaultService } from '@/gingerJs_api_client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { PackageRunnerForm } from '@/components/docker/packages/forms/PackagePullerForm';
import { PackageCreatorForm } from '@/components/docker/packages/forms/PackageCreatorForm';

const fetchPackages = async () => {
  const response = await DefaultService.apiDockerPackagesGet();
  // Map Package_Info to PackageInfo shape if needed
  return response.packages.map(pkg => ({
    id: pkg.id,
    name: Array.isArray(pkg.name) ? pkg.name[0] : pkg.name,
    tags: pkg.tags,
    created: pkg.created,
    size: pkg.size,
    virtual_size: pkg.virtual_size,
    repoTags: pkg.repo_tags,
    parentId: undefined,
    layers: [],
  }));
};

const PackagesPage = () => {
  const [showPackagePullModal, setShowPackagePullModal] = useState(false);
  const [showPackageCreateModal, setShowPackageCreateModal] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);
  const [successPackage, setSuccessPackage] = useState<PackageInfo | null>(null);
  const [pullSubmitting, setPullSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [error, setError] = useState(undefined);

  useEffect(() => {
      fetchPackages().then((res)=>{
        setPackages(res)
      }).catch(error=>{
        setError(error)
      })
  }, []);

  // Play handler
  const handlePlay = async (row: PackageTableData) => {
    const pkg = row.package;
    try {
      await DefaultService.apiDockerPackagesPost({
        requestBody: {
          action: 'run',
          packageId: pkg.id,
        },
      });
      setSuccessPackage(pkg);
      setShowConfettiModal(true);
      toast.success('Package run successfully');
      const newPackages = await fetchPackages();
      setPackages(newPackages);
      setTimeout(() => {
        setShowConfettiModal(false);
        setSuccessPackage(null);
      }, 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to run package');
    }
  };

  // Delete handler
  const handleDelete = async (row: PackageTableData) => {
    const pkg = row.package;
    try {
      const responseData = await DefaultService.apiDockerPackagesPost({
        requestBody: {
          action: 'remove',
          packageId: pkg.id,
        },
      });
      toast.success('Package removed successfully');
      const newPackages = await fetchPackages();
      setPackages(newPackages);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove package');
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <ContainerIcon className="h-4 w-4" />
              <h2>Packages</h2>
            </div>
          }
          shortDescription="Browse and manage Docker packages—inspect metadata, delete unused packages, or pull new ones."
          description="Docker packages (images) are read-only templates used to create containers. They package an application along with its environment, libraries, and dependencies into a single artifact that can be versioned and shared. Packages serve as the blueprint for container instances and are typically stored in container registries."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Packages</CardTitle>
              <CardDescription>
                {packages.length} packages found
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPackagePullModal(true)}
              >
                <ArrowDownToLineIcon className="w-4 h-4 mr-2" />
                Pull package
              </Button>
              <Button
                onClick={() => setShowPackageCreateModal(true)}
              >
                <ContainerIcon className="w-4 h-4 mr-2" />
                Create package
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <PackagesList packages={packages} onPlay={handlePlay} onDelete={handleDelete} />
          </CardContent>
        </Card>
      </div>

      {/* Pull Package Dialog */}
      <Dialog open={showPackagePullModal} onOpenChange={setShowPackagePullModal}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <ArrowDownToLineIcon className="h-5 w-5" />
              Pull Package
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <PackageRunnerForm
              onSubmitHandler={async (pullPackageInfo) => {
                setPullSubmitting(true);
                const response = await fetch("/api/packges", {
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
                const responseData = await response.json();
                setPullSubmitting(false);
                if (responseData.error) {
                  toast.error(responseData.message);
                  return;
                }
                setShowPackagePullModal(false);
                toast.success(responseData.message);
                const newPackages = await fetchPackages();
                setPackages(newPackages);
              }}
              submitting={pullSubmitting}
              setSubmitting={setPullSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Package Dialog */}
      <Dialog open={showPackageCreateModal} onOpenChange={setShowPackageCreateModal}>
        <DialogContent className="max-w-none w-screen h-screen p-0">
          <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
            <DialogTitle className="flex items-center gap-2 w-full px-6">
              <ContainerIcon className="h-5 w-5" />
              Create Package
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-8rem)] px-6">
            <PackageCreatorForm
              onSubmitHandler={async (data) => {
                setCreateSubmitting(true);
                const response = await fetch("/api/packges", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "create",
                    create_config: data,
                  }),
                });
                const responseData = await response.json();
                setCreateSubmitting(false);
                if (responseData.error) {
                  toast.error(responseData.message);
                  return;
                }
                setShowPackageCreateModal(false);
                toast.success(responseData.message);
                const newPackages = await fetchPackages();
                setPackages(newPackages);
              }}
              submitting={createSubmitting}
              setSubmitting={setCreateSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Confetti Dialog */}
      <Dialog open={showConfettiModal} onOpenChange={setShowConfettiModal}>
        <DialogContent className="flex flex-col items-center justify-center">
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg width="100%" height="100%" viewBox="0 0 400 200">
              <circle cx="50" cy="40" r="6" fill="#fbbf24" />
              <circle cx="120" cy="80" r="5" fill="#34d399" />
              <circle cx="200" cy="60" r="7" fill="#60a5fa" />
              <circle cx="300" cy="100" r="6" fill="#f472b6" />
              <circle cx="350" cy="30" r="5" fill="#f87171" />
              <circle cx="80" cy="150" r="7" fill="#a78bfa" />
              <circle cx="250" cy="170" r="6" fill="#fbbf24" />
              <circle cx="180" cy="120" r="5" fill="#34d399" />
              <circle cx="320" cy="60" r="7" fill="#60a5fa" />
            </svg>
          </div>
          <DialogTitle className="z-20 text-2xl font-bold text-center mt-8">🎉 Package started!</DialogTitle>
          {successPackage && (
            <div className="z-20 text-lg text-center mt-2">{successPackage.name} is now running.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesPage;

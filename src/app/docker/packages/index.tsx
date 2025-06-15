import React, { useEffect, useState } from "react";
import useAutoRefresh from "@/components/containers/hooks/useAutoRefresh";
import { ArrowDownToLineIcon, ContainerIcon, Loader, LoaderIcon } from "lucide-react";
import { PackagesList } from "@/components/packages/PackagesList";
import { toast } from "sonner";
import { PackageCreatorModal } from "@/components/packages/runner/CreatePackageModal";
import { PackageInfo } from "@/types/package";
import { PackageTableData } from '@/components/packages/PackagesList';
import { DefaultService } from '@/gingerJs_api_client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { PackageRunnerForm } from '@/components/packages/runner/PackgerRunnerForm';

const fetchPackages = async () => {
  const response = await DefaultService.apiPackgesGet();
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

const PackagesPage= () => {
  const [showPackagePullModal, setShowPackagePullModal] = useState(false);
  const [showPackageCreateModal, setShowPackageCreateModal] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);
  const [successPackage, setSuccessPackage] = useState<PackageInfo | null>(null);
  const [pullSubmitting, setPullSubmitting] = useState(false);

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
      await DefaultService.apiPackgesPost({
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
      const responseData = await DefaultService.apiPackgesPost({
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
          shortDescription="Manage your Docker packages—view, pull, create, or delete images from a centralized interface."
          description="Docker packages (images) are the building blocks for containers. Manage your images here: pull from registries, create new ones, or remove unused images to keep your environment clean and efficient."
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
      <Sheet open={showPackagePullModal} onOpenChange={setShowPackagePullModal}>
        <SheetContent className="!w-[30%] sm:!max-w-[30%]">
          <SheetHeader>
            <SheetTitle>Pull package</SheetTitle>
          </SheetHeader>
          <div className="p-4 h-[86vh]">
            <PackageRunnerForm
              onSubmitHandler={async (pullPackageInfo) => {
                setPullSubmitting(true);
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
                setPullSubmitting(false);
                if (responseData.error) {
                  toast.error(responseData.message);
                  return;
                }
                setShowPackagePullModal(false);
                toast.success(responseData.message);
              }}
              submitting={pullSubmitting}
              setSubmitting={setPullSubmitting}
            />
          </div>
          <SheetFooter className='p-4'>
            <Button type="button" variant="outline" onClick={() => setShowPackagePullModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="pull-package-form" disabled={pullSubmitting} onClick={() => {}}>
            {pullSubmitting ? (
                <LoaderIcon className="w-4 h-4 mr-2" />
              ) : (
                <ArrowDownToLineIcon className="w-4 h-4 mr-2" />
              )}
              Pull
              Pull Package
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
      <Dialog open={showConfettiModal} onOpenChange={setShowConfettiModal}>
        <DialogContent className="flex flex-col items-center justify-center">
          {/* Simple SVG confetti */}
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

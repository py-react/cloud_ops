import React, { useEffect, useState } from "react";
import { ArrowDownToLineIcon, ContainerIcon, RefreshCw, HardDrive, Trash2, Plus } from "lucide-react";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { PackagesList } from "@/components/docker/packages/PackagesList";
import { toast } from "sonner";
import { PackageInfo } from "@/types/package";
import { PackageTableData } from '@/components/docker/packages/PackagesList';
import { DefaultService } from '@/gingerJs_api_client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import RouteDescription from '@/components/route-description';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { PackageRunnerForm } from '@/components/docker/packages/forms/PackagePullerForm';
import { PackageCreatorForm } from '@/components/docker/packages/forms/PackageCreatorForm';

const fetchPackages = async () => {
  const response: any = await DefaultService.apiDockerPackagesGet();
  // Map Package_Info to PackageInfo shape if needed
  return response.packages.map((pkg: any) => ({
    id: pkg.id,
    name: Array.isArray(pkg.name) ? pkg.name[0] : pkg.name,
    tags: pkg.tags,
    created: pkg.created,
    size: pkg.size,
    virtual_size: Number(pkg.virtual_size) || 0,
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
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    fetchPackages().then((res) => {
      setPackages(res)
    }).catch(error => {
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

  const handlePush = async (row: PackageTableData) => {
    const pkg = row.package;
    try {
      const response: any = await DefaultService.apiDockerRegistryPost({
        imageName: pkg.tags[0].split(":")[0],
        sourceTag: pkg.tags[0].split(":")[1],
      });
      toast.success(response.message + " " + response.pull_command);
      const newPackages = await fetchPackages();
      setPackages(newPackages);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to push package');
    }
  };

  const handleBulkPlay = async (pkgs: PackageTableData[]) => {
    try {
      const promises = pkgs.map(p =>
        DefaultService.apiDockerPackagesPost({
          requestBody: { action: 'run', packageId: p.package.id },
        })
      );
      await Promise.all(promises);
      toast.success(`${pkgs.length} packages started successfully`);
      const newPackages = await fetchPackages();
      setPackages(newPackages);
    } catch (err: any) {
      toast.error('Failed to run some packages');
    }
  };

  const handleBulkDelete = async (pkgs: PackageTableData[]) => {
    try {
      const promises = pkgs.map(p =>
        DefaultService.apiDockerPackagesPost({
          requestBody: { action: 'remove', packageId: p.package.id },
        })
      );
      await Promise.all(promises);
      toast.success(`${pkgs.length} packages removed successfully`);
      const newPackages = await fetchPackages();
      setPackages(newPackages);
    } catch (err: any) {
      toast.error('Failed to remove some packages');
    }
  };

  const stats = {
    total: packages.length,
    totalSize: packages.reduce((acc, p) => acc + (p.size || p.virtual_size || 0), 0),
    unused: packages.filter(p => !p.repoTags || p.repoTags.length === 0).length,
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
        {/* Page Header */}
        <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-b border-border/100 pb-2 mb-2">
          <div>
            <div className="flex items-center gap-4 mb-1 p-1">
              <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <ContainerIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Packages</h1>
                <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-0 mt-2">
                  Pull templates, build custom packages, and monitor storage.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" onClick={() => fetchPackages().then(setPackages)}>
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowPackagePullModal(true)}>
                <ArrowDownToLineIcon className="w-3.5 h-3.5 mr-2" />
                Pull
              </Button>
              <Button variant="gradient" onClick={() => setShowPackageCreateModal(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Stats Section */}
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total"
            count={stats.total}
            icon={<ContainerIcon className="w-4 h-4" />}
            color="bg-primary"
            className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          />
          <ResourceCard
            title="Storage"
            count={formatSize(stats.totalSize).split(' ')[0]}
            unit={formatSize(stats.totalSize).split(' ')[1]}
            icon={<HardDrive className="w-4 h-4" />}
            color="bg-blue-500"
            className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          />
          <ResourceCard
            title="Unused"
            count={stats.unused}
            icon={<Trash2 className="w-4 h-4" />}
            color="bg-orange-500"
            className="border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all"
          />
        </div>

        <div className="flex-1 min-h-0 mt-10">
          <PackagesList
            packages={packages}
            onPlay={handlePlay}
            onDelete={handleDelete}
            onPush={handlePush}
            onBulkPlay={handleBulkPlay}
            onBulkDelete={handleBulkDelete}
            title="Image Registry"
            description="Local container image storage and management"
            icon={<HardDrive className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Pull Package Dialog */}
      <PackageRunnerForm
        isWizardOpen={showPackagePullModal}
        setIsWizardOpen={setShowPackagePullModal}
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

      {/* Create Package Dialog */}
      <PackageCreatorForm
        isWizardOpen={showPackageCreateModal}
        setIsWizardOpen={setShowPackageCreateModal}
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
    </>
  );
};

export default PackagesPage;

import React, { useEffect, useState } from "react";
import { ArrowDownToLineIcon, ContainerIcon, RefreshCw, HardDrive, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { PackagesList } from "@/components/docker/packages/PackagesList";
import { toast } from "sonner";
import { PackageInfo } from "@/types/package";
import { PackageTableData } from '@/components/docker/packages/PackagesList';
import { DefaultService } from '@/gingerJs_api_client';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PackageRunnerForm } from '@/components/docker/packages/forms/PackagePullerForm';
import { PackageCreatorForm } from '@/components/docker/packages/forms/PackageCreatorForm';
import PageLayout from "@/components/PageLayout";
import useNavigate from "@/libs/navigate";


const fetchPackages = async (summary = false) => {
  const url = summary ? '/api/docker/packages?summary=true' : '/api/docker/packages';
  const res = await fetch(url);
  const response: any = await res.json();
  
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

const fetchStats = async () => {
  try {
    const res = await fetch('/api/docker/packages/stats');
    const data = await res.json();
    return data.stats || {};
  } catch (err) {
    console.error("Failed to fetch package stats:", err);
    return {};
  }
};

const PackagesPage = () => {
  const navigate = useNavigate();
  const [showPackagePullModal, setShowPackagePullModal] = useState(false);
  const [showPackageCreateModal, setShowPackageCreateModal] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);
  const [successPackage, setSuccessPackage] = useState<PackageInfo | null>(null);
  const [pullSubmitting, setPullSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Phase 1: Fast Summary Load (~8s)
      const res = await fetchPackages(true);
      setPackages(res);
      setIsLoading(false); // Show the table immediately

      // Phase 2: Background Stats Load (~25s)
      setIsStatsLoading(true);
      const stats = await fetchStats();
      setPackages(prev => prev.map(pkg => ({
        ...pkg,
        size: stats[pkg.id]?.size ?? pkg.size,
        virtual_size: stats[pkg.id]?.virtual_size ?? pkg.virtual_size
      })));
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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
      await refreshData();
      setTimeout(() => {
        setShowConfettiModal(false);
        setSuccessPackage(null);
      }, 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to run package');
    }
  };

  const handleDelete = async (row: PackageTableData) => {
    const pkg = row.package;
    try {
      await DefaultService.apiDockerPackagesPost({
        requestBody: {
          action: 'remove',
          packageId: pkg.id,
        },
      });
      toast.success('Package removed successfully');
      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove package');
    }
  };

  const handlePush = async (row: PackageTableData) => {
    const pkg = row.package;
    try {
      const response: any = await DefaultService.apiDockerRegistryPost({
        requestBody: {
          action: 'push_image',
          image_name: pkg.tags[0].split(":")[0],
          source_tag: pkg.tags[0].split(":")[1],
          name: pkg.tags[0].split(":")[0], // Name is required in CreateRegistryRequest
        }
      });
      toast.success(response.message);
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
    <PageLayout
      title="Packages"
      subtitle="Pull templates, build custom packages, and monitor storage."
      icon={ContainerIcon}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading || isStatsLoading ? 'animate-spin' : ''}`} />
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
      }
    >
      {/* Hero Stats Section */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
        <ResourceCard
          title="Total"
          count={stats.total}
          icon={<ContainerIcon className="w-4 h-4" />}
          color="bg-primary"
          className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
          isLoading={isLoading}
        />
        <ResourceCard
          title="Storage"
          count={formatSize(stats.totalSize).split(' ')[0]}
          unit={formatSize(stats.totalSize).split(' ')[1]}
          icon={<HardDrive className="w-4 h-4" />}
          color="bg-blue-500"
          className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          isLoading={isLoading}
        />
        <ResourceCard
          title="Unused"
          count={stats.unused}
          icon={<Trash2 className="w-4 h-4" />}
          color="bg-orange-500"
          className="border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all"
          isLoading={isLoading}
        />
      </div>

      <PackagesList
        packages={filteredPackages}
        isLoading={isLoading}
        onPlay={handlePlay}
        onDelete={handleDelete}
        onPush={handlePush}
        onBulkPlay={handleBulkPlay}
        onBulkDelete={handleBulkDelete}
        onViewDetails={(row) => navigate(`/cee/docker/packages/${row.package.id}`)}
        title="Image Registry"
        description="Local container image storage and management"
        icon={<HardDrive className="w-5 h-5 text-primary" />}
        extraHeaderContent={
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search images..."
              className="w-full pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      />

      <PackageRunnerForm
        isWizardOpen={showPackagePullModal}
        setIsWizardOpen={setShowPackagePullModal}
        onSubmitHandler={async (pullPackageInfo) => {
          setPullSubmitting(true);
          const response: any = await DefaultService.apiDockerPackagesPost({
            requestBody: {
              action: "pull",
              pull_config: {
                image: pullPackageInfo.image,
                registry: pullPackageInfo.registry,
              },
            }
          });
          setPullSubmitting(false);
          if (response.error) {
            toast.error(response.message);
            return;
          }
          setShowPackagePullModal(false);
          toast.success(response.message);
          await refreshData();
        }}
        submitting={pullSubmitting}
        setSubmitting={setPullSubmitting}
      />

      <PackageCreatorForm
        isWizardOpen={showPackageCreateModal}
        setIsWizardOpen={setShowPackageCreateModal}
        onSubmitHandler={async (data) => {
          setCreateSubmitting(true);
          const response: any = await DefaultService.apiDockerPackagesPost({
            requestBody: {
              action: "create",
              create_config: data,
            }
          });
          setCreateSubmitting(false);
          if (response.error) {
            toast.error(response.message);
            return;
          }
          setShowPackageCreateModal(false);
          toast.success(response.message);
          await refreshData();
        }}
        submitting={createSubmitting}
        setSubmitting={setCreateSubmitting}
      />

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
    </PageLayout>
  );
};

export default PackagesPage;

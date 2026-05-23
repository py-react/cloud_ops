import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Power,
} from 'lucide-react';
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface KubeConfigFile {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const KubeConfigTable = ({ onRefresh }: { onRefresh?: () => void }) => {
  const [configs, setConfigs] = useState<KubeConfigFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/kubernertes/configs');
      if (!response.ok) throw new Error('Failed to fetch configs');
      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      toast.error("Failed to load Kubeconfigs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const response = await fetch('/api/kubernertes/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', id }),
      });
      if (!response.ok) throw new Error('Activation failed');
      toast.success("Kubeconfig activated successfully");
      toast.info("Reloading platform with new cluster data...");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      toast.error("Failed to activate config");
    }
  };

  const handleDelete = async (row: any) => {
    try {
      const response = await fetch(`/api/kubernertes/configs?id=${row.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Deletion failed');
      toast.success("Kubeconfig deleted");
      
      if (row.is_active) {
        toast.info("Active configuration removed. Reloading platform...");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        fetchConfigs();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete config");
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const columns = useMemo(() => [
    {
      header: "Name",
      accessor: "name",
      cell: (row: KubeConfigFile) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      cell: (row: KubeConfigFile) => (
        row.is_active ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-400 border-gray-200 font-normal text-xs">
            Inactive
          </Badge>
        )
      )
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row: KubeConfigFile) => (
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {format(new Date(row.created_at), 'MMM d, yyyy HH:mm')}
        </div>
      )
    }
  ], []);

  return (
    <ResourceTable
      data={configs}
      columns={columns}
      loading={isLoading}
      title="Stored Kubeconfigs"
      description="Switch between different Kubernetes configuration files stored securely in the database."
      icon={<FileText className="w-5 h-5 text-primary" />}
      onDelete={(row) => {
        if (row.is_active && configs.length > 1) {
            toast.error("Cannot delete the active Kubeconfig. Please activate another one first.");
            return;
        }
        handleDelete(row);
      }}
      customActions={[
        {
          label: "Activate",
          icon: Power,
          onClick: (row) => handleActivate(row.id),
          show: (row) => !row.is_active,
        }
      ]}
    />
  );
};

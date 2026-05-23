import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as z from 'zod';
import { Box, Sliders, HardDrive, LayoutGrid, Calculator } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { TypeStep, IdentityStep, ConfigStep, CostingStep } from './CreateStorageSteps';
import { getAuthToken } from '@/libs/auth';
import { toast } from 'sonner';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';

export interface GCPMetadata {
  regions: { id: string; name: string; zones_count?: number }[];
  zones: { id: string; name: string; region: string }[];
  storage_locations: { id: string; name: string; type: string }[];
  disk_types: { id: string; name: string; description: string; valid_disk_size: string; zone: string }[];
  storage_classes: { id: string; name: string; description: string }[];
  filestore_locations: { id: string; name: string }[];
  networks: { id: string; name: string; auto_create: boolean }[];
  errors?: Record<string, {
    status: string;
    error_type: string;
    message: string;
    action_required: string;
    project_id?: string;
    service_name?: string;
  }>;
}

const schema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  resource_type: z.enum(['bucket', 'disk', 'filestore']).default('bucket'),
  name: z.string().min(3, "Name must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  location: z.string().min(1, "Location is required").optional(),
  storage_class: z.string().min(1, "Storage class is required").optional(),
  zone: z.string().min(1, "Zone is required").optional(),
  size_gb: z.number().min(1, "Size must be at least 1 GB").optional(),
  disk_type: z.string().min(1, "Disk type is required").optional(),
  filestore_tier: z.string().min(1, "Tier is required").optional(),
  file_share_name: z.string().min(1, "File share name is required").optional(),
  autoclass_enabled: z.boolean().default(false),
  hierarchical_namespace_enabled: z.boolean().default(false),
  rapid_cache_enabled: z.boolean().default(false),
  soft_delete_days: z.number().min(0).max(365).default(7),
  versioning_enabled: z.boolean().default(false),
  encryption_kms_key: z.string().default(""),
});

export type CreateStorageValues = z.infer<typeof schema>;

interface CreateStorageWizardProps {
  projectId: string;
  onSubmit: (data: CreateStorageValues) => Promise<void>;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  defaultType?: 'bucket' | 'disk' | 'filestore';
}

export function CreateStorageWizard({
  projectId,
  onSubmit,
  isWizardOpen,
  setIsWizardOpen,
  defaultType = 'bucket',
}: CreateStorageWizardProps) {
  const { selectedGcpCredential } = useGCP();
  const [activeTab, setActiveTab] = useState('type');
  const [metadata, setMetadata] = useState<GCPMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [diskTypesByZone, setDiskTypesByZone] = useState<Record<string, any[]>>({});

  const fetchMetadata = useCallback(async () => {
    if (!selectedGcpCredential?.id || !projectId) return;
    setLoadingMetadata(true);
    setMetadataError(null);
    const token = getAuthToken();
    const credId = selectedGcpCredential.id;
    try {
      const url = `/api/v1/gcp/meta?project_id=${projectId}&credential_id=${credId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'error') {
        setMetadataError(data.message || 'Failed to fetch GCP metadata');
      } else {
        setMetadata(data);
      }
    } catch {
      setMetadataError('Network error while fetching GCP metadata');
    } finally {
      setLoadingMetadata(false);
    }
  }, [projectId, selectedGcpCredential?.id]);

  const fetchedZonesRef = useRef<Set<string>>(new Set());

  const fetchDiskTypesForZone = useCallback(async (zone: string) => {
    if (!selectedGcpCredential?.id || !projectId || !zone) return;
    if (fetchedZonesRef.current.has(zone)) return;

    fetchedZonesRef.current.add(zone);
    const token = getAuthToken();
    const credId = selectedGcpCredential.id;
    try {
      const url = `/api/v1/gcp/compute/disk-types?project_id=${projectId}&zone=${zone}&credential_id=${credId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDiskTypesByZone(prev => ({ ...prev, [zone]: data.disk_types || [] }));
    } catch (err) {
      console.error('Failed to fetch disk types:', err);
    }
  }, [projectId, selectedGcpCredential?.id]);

  useEffect(() => {
    if (isWizardOpen && projectId && selectedGcpCredential?.id) {
      fetchMetadata();
      setDiskTypesByZone({});
      fetchedZonesRef.current = new Set();
    }
  }, [isWizardOpen, fetchMetadata]);

    const steps = [
      {
        id: 'type',
        label: 'Resource Type',
        icon: LayoutGrid,
        description: 'Object or Block storage',
        longDescription: 'Select the type of storage you want to provision.',
        component: TypeStep,
      },
      {
        id: 'identity',
        label: 'Identity',
        icon: Box,
        description: 'Naming and scoping',
        longDescription: 'Provide a name for your storage resource.',
        component: IdentityStep,
        canNavigateNext: (form: any) => {
          const name = form.watch('name');
          return {
            can: !!name && name.length >= 3,
            message: "Resource name is required to proceed"
          };
        }
      },
      {
        id: 'config',
        label: 'Configuration',
        icon: Sliders,
        description: 'Performance and location',
        longDescription: 'Finalize the technical specifications for your storage.',
        component: ConfigStep,
        props: {
          metadata,
          loading: loadingMetadata,
          error: metadataError,
          onRetry: fetchMetadata,
          diskTypesByZone,
          fetchDiskTypesForZone,
        },
        canNavigateNext: (form: any) => {
          const type = form.watch('resource_type');
          if (type === 'bucket') {
            const location = form.watch('location');
            const storageClass = form.watch('storage_class');
            return {
              can: !!location && !!storageClass,
              message: "Location and storage class are required"
            };
          }
          if (type === 'disk') {
            const zone = form.watch('zone');
            const diskType = form.watch('disk_type');
            const sizeGb = form.watch('size_gb');
            return {
              can: !!zone && !!diskType && sizeGb > 0,
              message: "Zone, disk type, and size are required"
            };
          }
          if (type === 'filestore') {
            const zone = form.watch('zone');
            const sizeGb = form.watch('size_gb');
            const fileShareName = form.watch('file_share_name');
            return {
              can: !!zone && sizeGb >= 1024 && !!fileShareName,
              message: "Zone, file share name, and capacity (min 1024 GB) are required"
            };
          }
          return { can: false, message: "Select a resource type" };
        }
      },
      {
        id: 'costing',
        label: 'Cost Estimate',
        icon: Calculator,
        description: 'Monthly pricing breakdown',
        longDescription: 'Review the estimated cost based on your configuration.',
        component: CostingStep,
      }
    ];

  const initialValues: Partial<CreateStorageValues> = {
    project_id: projectId,
    resource_type: defaultType,
    name: "",
  };

  return (
    <FormWizard
      name="create-storage-wizard"
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      steps={steps}
      schema={schema as z.ZodSchema<any>}
      initialValues={initialValues as any}
      onSubmit={onSubmit as any}
      submitLabel="Provision Storage"
      submitIcon={HardDrive}
      heading={{
        primary: "Create Storage",
        secondary: `Orchestrating resources in ${projectId}`,
        icon: Box,
      }}
    />
  );
}

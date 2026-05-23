import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { Server, Cpu, Calculator } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { VMIdentityStep, VMConfigStep, VMCostingStep } from './CreateVMSteps';
import { getAuthToken } from '@/libs/auth';
import { toast } from 'sonner';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';

const schema = z.object({
    project_id: z.string().min(1, "Project ID is required"),
    instance_name: z.string().min(3, "Name must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
    zone: z.string().min(1, "Zone is required"),
    machine_type: z.string().min(1, "Machine type is required"),
    boot_disk_size_gb: z.number().min(10, "Boot disk size must be at least 10 GB").default(10),
    boot_disk_type: z.string().min(1, "Boot disk type is required").default("pd-balanced"),
    os_image: z.string().min(1, "OS Image is required").default("projects/debian-cloud/global/images/family/debian-12"),
    selected_os_key: z.string().min(1, "OS Key is required").default("debian-12"),
    ssh_key_id: z.string().optional(),
    ssh_username: z.string().optional(),
    ssh_key: z.string().optional(),
});

export type CreateVMValues = z.infer<typeof schema>;

interface CreateVMWizardProps {
    projectId: string;
    onSubmit: (data: CreateVMValues) => Promise<void>;
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;
}

export function CreateVMWizard({ projectId, onSubmit, isWizardOpen, setIsWizardOpen }: CreateVMWizardProps) {
    const { selectedGcpCredential } = useGCP();
    const [activeTab, setActiveTab] = useState('identity');
    const [metadata, setMetadata] = useState<any>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [images, setImages] = useState<any[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    const [bastionKeys, setBastionKeys] = useState<any[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const formRef = React.useRef<any>(null);

    useEffect(() => {
        if (isWizardOpen && projectId) {
            fetchMetadata(projectId);
            fetchBastionKeys();
            fetchImages(projectId);
        }
    }, [isWizardOpen, projectId]);

    const fetchImages = async (pid: string) => {
        if (!selectedGcpCredential?.id) return;
        setLoadingImages(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        try {
            const res = await fetch(`/api/v1/gcp/compute/images?project_id=${pid}&credential_id=${credId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success' && data.images) {
                const imageArray = Object.entries(data.images).map(([osKey, imgData]: [string, any]) => ({
                    osKey,
                    id: osKey,
                    label: imgData.label,
                    gcp_uri: imgData.gcp_uri,
                    min_disk_gb: imgData.min_disk_gb,
                    os_family: imgData.os_family,
                    latest_image_name: imgData.latest_image_name,
                }));
                setImages(imageArray);
                // TODO: Windows Server RDP rendering not yet stable.
                // Remove this filter once the Guacamole black-screen issue on Server Core is resolved.
                const nonWindowsImages = imageArray.filter((img: any) => img.os_family !== 'windows');
                setImages(nonWindowsImages);
                if (nonWindowsImages.length > 0 && !formRef.current?.watch('os_image')) {
                    const defaultImage = nonWindowsImages.find((img: any) => img.osKey === 'debian-12') || nonWindowsImages[0];
                    formRef.current?.setValue('os_image', defaultImage.gcp_uri);
                    formRef.current?.setValue('selected_os_key', defaultImage.osKey);
                    formRef.current?.setValue('boot_disk_size_gb', Math.max(10, defaultImage.min_disk_gb));
                }
            }
        } catch {
            console.error('Failed to fetch live image catalog');
        } finally {
            setLoadingImages(false);
        }
    };

    const fetchBastionKeys = async () => {
        setLoadingKeys(true);
        const token = getAuthToken();
        try {
            const res = await fetch('/api/bastion/keys', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.error && data.keys) {
                setBastionKeys(data.keys);
            }
        } catch {
            console.error('Failed to load Bastion SSH keys');
        } finally {
            setLoadingKeys(false);
        }
    };

    const fetchMetadata = async (pid: string) => {
        if (!selectedGcpCredential?.id) return;
        setLoadingMetadata(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential.id;
        try {
            const res = await fetch(`/api/v1/gcp/meta?project_id=${pid}&credential_id=${credId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status !== 'error') {
                setMetadata(data);
            }
        } catch {
            toast.error('GCP Metadata sync failed');
        } finally {
            setLoadingMetadata(false);
        }
    };

    const steps = [
        {
            id: 'identity',
            label: 'Identity',
            icon: Server,
            description: 'Name your instance',
            longDescription: 'Provide a unique name for your VM instance within the project.',
            component: VMIdentityStep,
            canNavigateNext: (form: any) => {
                const name = form.watch('instance_name');
                return {
                    can: !!name && name.length >= 3 && /^[a-z0-9-]+$/.test(name),
                    message: 'A valid instance name is required to proceed.',
                };
            },
        },
        {
            id: 'config',
            label: 'Configuration',
            icon: Cpu,
            description: 'Zone and specifications',
            longDescription: 'Select the zone, machine type, boot disk, and operating system image.',
            component: VMConfigStep,
            props: { metadata, loading: loadingMetadata || loadingImages, bastionKeys, loadingKeys, images },
            canNavigateNext: (form: any) => {
                const zone = form.watch('zone');
                const machine = form.watch('machine_type');
                const osImage = form.watch('os_image');
                const size = form.watch('boot_disk_size_gb');
                const diskType = form.watch('boot_disk_type');
                const selectedImg = images.find((img: any) => img.gcp_uri === osImage || img.osKey === form.watch('selected_os_key'));
                const minDisk = selectedImg?.min_disk_gb || 10;
                return {
                    can: !!zone && !!machine && !!osImage && size >= minDisk && !!diskType,
                    message: `Zone, machine type, OS image, boot disk type, and disk size (min ${minDisk} GB) are required.`,
                };
            },
        },
        {
            id: 'costing',
            label: 'Cost Estimate',
            icon: Calculator,
            description: 'Usage run-rate simulation',
            longDescription: 'Review the estimated monthly cost based on your run-rate simulation.',
            component: VMCostingStep,
        },
    ];

    const initialValues: Partial<CreateVMValues> = {
        project_id: projectId,
        instance_name: '',
        machine_type: 'e2-micro',
        boot_disk_size_gb: 10,
        boot_disk_type: 'pd-balanced',
        os_image: 'projects/debian-cloud/global/images/family/debian-12',
        selected_os_key: 'debian-12',
        ssh_key_id: '',
        ssh_username: '',
        ssh_key: '',
    };

    return (
        <FormWizard
            name="create-vm-wizard"
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
            currentStep={activeTab}
            setCurrentStep={setActiveTab}
            steps={steps}
            schema={schema as z.ZodSchema<any>}
            initialValues={initialValues as any}
            onSubmit={onSubmit as any}
            submitLabel="Deploy Instance"
            submitIcon={Cpu}
            heading={{
                primary: "New VM Instance",
                secondary: `Provisioning compute in ${projectId}`,
                icon: Server,
            }}
        />
    );
}

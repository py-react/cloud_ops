import React, { useEffect, useState, useCallback } from 'react';
import * as z from 'zod';
import { Globe, Cpu, Network, Tags, Server } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { BasicStep, ConfigurationStep, NetworkStep, TagsStep } from './CreateEC2Steps';
import { getAuthToken } from '@/libs/auth';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';

interface SelectOption {
    value: string;
    label: string;
    description?: string;
    free_tier_eligible?: boolean;
    ingress?: any[];
    egress?: any[];
}

interface ImageOption {
    os_family: string;
    image_id: string;
    name: string;
    description?: string;
} 

const schema = z.object({
    instance_name: z.string().min(1, "Instance name is required"),
    region: z.string().min(1, "Region is required"),
    image_id: z.string().default("__latest__"),
    instance_type: z.string().min(1, "Instance type is required"),
    key_name: z.string().optional().default(''),
    availability_zone: z.string().optional().default('__auto__'),
    subnet_id: z.string().optional().default(''),
    security_group_id: z.string().optional().default(''),
    bastion_enabled: z.boolean().default(true),
    tags: z.array(z.object({ key: z.string(), value: z.string() })).default([{ key: 'Name', value: '' }]),
});

export type CreateEC2Values = z.infer<typeof schema>;

interface CreateEC2WizardProps {
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;
    onSubmit: (data: CreateEC2Values) => Promise<void>;
}

export function CreateEC2Wizard({
    isWizardOpen,
    setIsWizardOpen,
    onSubmit,
}: CreateEC2WizardProps) {
    const { selectedAwsCredential } = useAWS();
    const [activeTab, setActiveTab] = React.useState('basic');
    const [regions, setRegions] = useState<SelectOption[]>([]);
    const [instanceTypes, setInstanceTypes] = useState<SelectOption[]>([]);
    const [images, setImages] = useState<ImageOption[]>([]);
    const [securityGroups, setSecurityGroups] = useState<SelectOption[]>([]);
    const [zones, setZones] = useState<SelectOption[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);
    const [wizardRegion, setWizardRegion] = useState('us-east-1');

    const credId = selectedAwsCredential?.id;

    useEffect(() => {
        if (!credId) return;
        const token = getAuthToken();
        fetch(`/api/v1/aws/meta?credential_id=${credId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.regions) setRegions(d.regions); })
            .catch(() => {});
    }, [credId]);

    const fetchMeta = useCallback(async (region: string) => {
        if (!credId) return;
        setMetaLoading(true);
        const token = getAuthToken();
        try {
            const [typesRes, imagesRes, sgsRes, zonesRes] = await Promise.all([
                fetch(`/api/v1/aws/compute/meta?category=instance_types&region=${region}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/v1/aws/compute/meta?category=images&region=${region}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/v1/aws/compute/meta?category=security_groups&region=${region}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/v1/aws/compute/meta?category=availability_zones&region=${region}&credential_id=${credId}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [typesData, imagesData, sgsData, zonesData] = await Promise.all([
                typesRes.json(), imagesRes.json(), sgsRes.json(), zonesRes.json(),
            ]);
            if (typesData.instance_types) setInstanceTypes(typesData.instance_types.map((t: any) => ({ value: t.instance_type, label: t.instance_type, free_tier_eligible: t.free_tier_eligible })));
            if (imagesData.public || imagesData.custom) {
                const all: ImageOption[] = [];
                if (imagesData.public) all.push(...imagesData.public);
                if (imagesData.custom) all.push(...imagesData.custom.map((i: any) => ({ ...i, os_family: 'Custom' })));
                setImages(all);
            }
            if (sgsData.security_groups) setSecurityGroups(sgsData.security_groups.map((sg: any) => ({
                value: sg.group_id, label: `${sg.group_name} (${sg.group_id})`,
                description: sg.description || '', ingress: sg.ingress_rules || [], egress: sg.egress_rules || [],
            })));
            if (zonesData.availability_zones) setZones(zonesData.availability_zones.map((z: any) => ({ value: z.zone_name, label: z.zone_name })));
        } catch { /* ignore */ }
        finally { setMetaLoading(false); }
    }, [credId]);

    useEffect(() => { fetchMeta(wizardRegion); }, [fetchMeta, wizardRegion]);

    const steps = [
        {
            id: 'basic',
            label: 'Basic',
            icon: Globe,
            description: 'Name and region',
            longDescription: 'Provide a name and select the AWS region for your instance.',
            component: BasicStep,
            props: { regions, onRegionChange: setWizardRegion },
        },
        {
            id: 'configuration',
            label: 'Configuration',
            icon: Cpu,
            description: 'Image and type',
            longDescription: 'Choose the AMI, instance type, and key pair.',
            component: ConfigurationStep,
            props: { instanceTypes, images, metaLoading, credId },
        },
        {
            id: 'network',
            label: 'Network',
            icon: Network,
            description: 'VPC and security',
            longDescription: 'Configure networking and security groups.',
            component: NetworkStep,
            props: {
                securityGroups,
                zones,
                metaLoading,
                credId,
                onSgCreated: (sg: SelectOption) => setSecurityGroups(prev => [...prev, sg]),
            },
        },
        {
            id: 'tags',
            label: 'Tags',
            icon: Tags,
            description: 'Organization',
            longDescription: 'Add optional tags for resource organization.',
            component: TagsStep,
        },
    ];

    const initialValues: Partial<CreateEC2Values> = {
        instance_name: '',
        region: 'us-east-1',
        image_id: '__latest__',
        instance_type: 't2.micro',
        key_name: '',
        availability_zone: '__auto__',
        subnet_id: '',
        security_group_id: '',
        bastion_enabled: true,
        tags: [{ key: 'Name', value: '' }],
    };

    return (
        <FormWizard
            name="create-ec2-wizard"
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
            currentStep={activeTab}
            setCurrentStep={setActiveTab}
            steps={steps}
            schema={schema as z.ZodSchema<any>}
            initialValues={initialValues as any}
            onSubmit={onSubmit as any}
            submitLabel="Create Instance"
            submitIcon={Server}
            heading={{
                primary: "Create EC2 Instance",
                secondary: "Provision a new virtual machine in AWS",
                icon: Server,
            }}
        />
    );
}

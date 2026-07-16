import React, { useEffect, useState } from 'react';
import * as z from 'zod';
import { Box, Globe, Database, Shield, Tags, HardDrive } from 'lucide-react';
import { FormWizard } from '@/components/wizard/form-wizard';
import { BasicStep, StorageStep, SecurityStep, TagsStep } from './CreateS3BucketSteps';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { DefaultService } from '@/gingerJs_api_client/services/DefaultService';

interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

const schema = z.object({
    bucket_name: z.string().min(3, "Bucket name must be at least 3 characters")
        .regex(/^[a-z0-9.-]+$/, "Only lowercase letters, numbers, dots, and hyphens allowed"),
    region: z.string().min(1, "Region is required"),
    storage_class: z.string().min(1, "Storage class is required"),
    versioning_enabled: z.boolean().default(false),
    versioning_expire_days: z.number().min(0).default(0),
    object_lock_enabled: z.boolean().default(false),
    object_lock_mode: z.enum(['GOVERNANCE', 'COMPLIANCE']).default('GOVERNANCE'),
    object_lock_days: z.number().min(1).default(30),
    encryption: z.enum(['AES256', 'aws:kms']).default('AES256'),
    kms_key_id: z.string().default(''),
    bucket_policy: z.string().default(''),
    tags: z.array(z.object({ key: z.string(), value: z.string() })).default([{ key: '', value: '' }]),
});

export type CreateS3BucketValues = z.infer<typeof schema>;

interface CreateS3BucketWizardProps {
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;
    onSubmit: (data: CreateS3BucketValues) => Promise<void>;
    editingBucket?: string;
    initialValuesOverride?: Partial<CreateS3BucketValues>;
}

export function CreateS3BucketWizard({
    isWizardOpen,
    setIsWizardOpen,
    onSubmit,
    editingBucket,
    initialValuesOverride,
}: CreateS3BucketWizardProps) {
    const { selectedAwsCredential } = useAWS();
    const [activeTab, setActiveTab] = React.useState('basic');
    const [regions, setRegions] = useState<SelectOption[]>([]);
    const [storageClasses, setStorageClasses] = useState<SelectOption[]>([]);
    const [encryptionOptions, setEncryptionOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        if (!selectedAwsCredential?.id || !isWizardOpen) return;
        const credId = selectedAwsCredential.id;
        DefaultService.apiV1AwsMetaGet({ credentialId: String(credId) })
            .then((d: any) => {
                if (d.regions) setRegions(d.regions);
                if (d.s3_storage_classes) setStorageClasses(d.s3_storage_classes);
                if (d.s3_encryption_options) setEncryptionOptions(d.s3_encryption_options);
            })
            .catch(() => {});
    }, [selectedAwsCredential?.id, isWizardOpen]);

    const steps = [
        {
            id: 'basic',
            label: 'Basic',
            icon: Globe,
            description: 'Name and region',
            longDescription: 'Provide a globally unique name and select the AWS region for your bucket.',
            component: BasicStep,
            props: { regions },
            canNavigateNext: (form: any) => {
                const name = form.watch('bucket_name');
                return {
                    can: !!name && name.length >= 3,
                    message: "Bucket name is required to proceed"
                };
            }
        },
        {
            id: 'storage',
            label: 'Storage',
            icon: Database,
            description: 'Class and protection',
            longDescription: 'Choose the storage class and configure data protection settings.',
            component: StorageStep,
            props: { storageClasses },
        },
        {
            id: 'security',
            label: 'Security',
            icon: Shield,
            description: 'Encryption and access',
            longDescription: 'Configure encryption and public access settings for your bucket.',
            component: SecurityStep,
            props: { encryptionOptions },
        },
        {
            id: 'tags',
            label: 'Tags',
            icon: Tags,
            description: 'Organization',
            longDescription: 'Add optional tags to organize and track your bucket costs.',
            component: TagsStep,
        },
    ];

    const defaultValues: Partial<CreateS3BucketValues> = {
        bucket_name: "",
        region: 'us-east-1',
        storage_class: "STANDARD",
        versioning_enabled: false,
        versioning_expire_days: 0,
        object_lock_enabled: false,
        object_lock_mode: 'GOVERNANCE',
        object_lock_days: 30,
        encryption: "AES256",
        kms_key_id: "",
        bucket_policy: '',
        tags: [{ key: '', value: '' }],
    };

    const initialValues = initialValuesOverride ? { ...defaultValues, ...initialValuesOverride } : defaultValues;

    return (
        <FormWizard
            name={editingBucket ? `edit-s3-bucket-${editingBucket}` : "create-s3-bucket-wizard"}
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
            currentStep={activeTab}
            setCurrentStep={setActiveTab}
            steps={steps}
            schema={schema as z.ZodSchema<any>}
            initialValues={initialValues as any}
            onSubmit={onSubmit as any}
            submitLabel={editingBucket ? "Update Bucket" : "Create Bucket"}
            submitIcon={HardDrive}
            heading={{
                primary: editingBucket ? `Edit Bucket: ${editingBucket}` : "Create S3 Bucket",
                secondary: editingBucket ? "Modify the configuration of your S3 bucket" : "Provision a new object storage bucket in AWS",
                icon: Box,
            }}
        />
    );
}

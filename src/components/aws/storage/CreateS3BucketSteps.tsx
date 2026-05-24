import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Globe, Database, Shield, Lock, Key, FileKey, EyeOff, Tags, Plus, Trash2 } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

export const BasicStep = ({ regions }: { regions: SelectOption[] }) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="bucket_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bucket Name</FormLabel>
                        <FormControl>
                            <Input placeholder="my-unique-bucket-name" className="font-mono" {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/[^a-z0-9.-]/g, '').toLowerCase())} />
                        </FormControl>
                        <FormDescription>Must be globally unique, 3-63 chars, lowercase letters/numbers/dots/hyphens.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="region"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> AWS Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {regions.map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose the geographic region where your bucket will be created.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export const StorageStep = ({ storageClasses }: { storageClasses: SelectOption[] }) => {
    const { control, watch } = useFormContext();
    const objectLockEnabled = watch('object_lock_enabled');
    const versioningEnabled = watch('versioning_enabled');

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="storage_class"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Storage Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {storageClasses.map(sc => (
                                    <SelectItem key={sc.value} value={sc.value}>{sc.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Choose the S3 storage class that best fits your access patterns.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="versioning_enabled"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                            <div className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                    <span className="text-sm font-bold">Versioning</span>
                                    <p className="text-[11px] text-muted-foreground">Keep noncurrent versions of objects for recovery and data protection.</p>
                                </div>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </div>
                    </FormItem>
                )}
            />
            {versioningEnabled && (
                <div className="mt-6 space-y-3">
                    <FormField
                        control={control}
                        name="versioning_expire_days"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Auto-expire noncurrent versions after (days)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={0} placeholder="0 = no auto-expire" className="font-mono"
                                        {...field}
                                        value={field.value ?? 0}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                                <FormDescription>Old versions older than this many days are automatically deleted. Set 0 to keep all versions indefinitely.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
            <FormField
                control={control}
                name="object_lock_enabled"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                            <div className="flex items-start gap-3">
                                <Lock className="w-4 h-4 text-amber-500 mt-0.5" />
                                <div>
                                    <span className="text-sm font-bold">Object Lock</span>
                                    <p className="text-[11px] text-muted-foreground">Prevent objects from being deleted or overwritten for a fixed period. Cannot be disabled once enabled.</p>
                                </div>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </div>
                    </FormItem>
                )}
            />

            {objectLockEnabled && (
                <div className="mt-6 space-y-5">
                    <FormField
                        control={control}
                        name="object_lock_mode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Retention Mode</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-background border-border/50">
                                        <SelectItem value="GOVERNANCE">Governance — can be overridden with IAM permissions</SelectItem>
                                        <SelectItem value="COMPLIANCE">Compliance — no one can override, not even root</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>Governance allows authorized users to shorten retention; Compliance is absolute.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="object_lock_days"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Retention Period (days)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} placeholder="30" className="font-mono"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                                </FormControl>
                                <FormDescription>Number of days objects are locked after upload. Minimum 1 day.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
};

const PUBLIC_READ_POLICY = `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}`;

function publicReadPolicy(bucketName: string) {
    return PUBLIC_READ_POLICY.replace(/BUCKET_NAME/g, bucketName);
}

export const SecurityStep = ({ encryptionOptions }: { encryptionOptions: SelectOption[] }) => {
    const { control, watch, setValue } = useFormContext();
    const encryptionVal = watch('encryption');

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="encryption"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Key className="w-3 h-3" /> Default Encryption</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {encryptionOptions.map(eo => (
                                    <SelectItem key={eo.value} value={eo.value}>{eo.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Encrypt objects at rest using server-side encryption.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {encryptionVal === 'aws:kms' && (
                <FormField
                    control={control}
                    name="kms_key_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1.5"><FileKey className="w-3 h-3" /> KMS Key ID</FormLabel>
                            <FormControl>
                                <Input placeholder="arn:aws:kms:us-east-1:123456789:key/abc-123" className="font-mono text-xs" {...field} />
                            </FormControl>
                            <FormDescription>The Amazon Resource Name (ARN) of your KMS key.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={control}
                name="bucket_policy"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bucket Policy (JSON)</FormLabel>
                        <FormControl>
                            <textarea
                                className="w-full h-40 px-3 py-2 text-xs font-mono rounded-lg border border-border/50 bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-200 resize-y"
                                placeholder='{ "Version": "2012-10-17", "Statement": [...] }'
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            Leave empty for default (all public access blocked). Provide a JSON policy to grant public or cross-account access.
                        </FormDescription>
                        <FormMessage />
                        <div className="flex gap-2 mt-2">
                            <Button type="button" variant="outline" size="sm" className="text-xs"
                                onClick={() => {
                                    const bn = watch('bucket_name');
                                    setValue('bucket_policy', publicReadPolicy(bn || 'YOUR_BUCKET_NAME'));
                                }}>
                                <EyeOff className="w-3 h-3 mr-1" /> Public Read Template
                            </Button>
                        </div>
                    </FormItem>
                )}
            />
        </div>
    );
};

export const TagsStep = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: 'tags' });

    return (
        <div className="space-y-6">
            <FormLabel className="flex items-center gap-1.5"><Tags className="w-3 h-3" /> Tags</FormLabel>
            <p className="text-[11px] text-muted-foreground -mt-4">Optional key-value pairs to organize and track your bucket costs.</p>
            {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`tags.${i}.key`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Key" className="font-mono text-xs" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`tags.${i}.value`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Value" className="font-mono text-xs" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => remove(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => append({ key: '', value: '' })}>
                <Plus className="w-3 h-3 mr-1" /> Add Tag
            </Button>
        </div>
    );
};

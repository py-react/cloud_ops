import React from 'react';
import { Package, Info } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const getChartSteps = ({ isEditing = false }: { isEditing?: boolean } = {}) => [
    {
        id: 'info',
        label: 'Chart Info',
        description: isEditing ? 'Edit chart metadata' : 'New chart details',
        longDescription: isEditing
            ? 'Update the chart identity fields stored in Chart.yaml.'
            : 'Provide basic metadata for your new Helm chart. You can add manifests and environments after creation.',
        icon: Package,
        component: ({ form }: any) => (
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chart Name *</Label>
                    <Input
                        {...form.register('name')}
                        placeholder="e.g. nginx-app, redis-cluster"
                        className="h-10 font-mono"
                        disabled={isEditing}
                        readOnly={isEditing}
                    />
                    {form.formState.errors.name && (
                        <p className="text-[11px] text-destructive">{form.formState.errors.name?.message as string}</p>
                    )}
                    {!isEditing && (
                        <p className="text-[10px] text-muted-foreground italic">Lowercase letters, numbers and hyphens only. Cannot be renamed.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                    <Input
                        {...form.register('description')}
                        placeholder="A short description of this chart"
                        className="h-10"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chart Version</Label>
                        <Input
                            {...form.register('version')}
                            placeholder="0.1.0"
                            className="h-10 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App Version</Label>
                        <Input
                            {...form.register('appVersion')}
                            placeholder="latest"
                            className="h-10 font-mono"
                        />
                    </div>
                </div>
            </div>
        )
    }
];

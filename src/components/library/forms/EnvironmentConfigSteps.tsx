import React from 'react';
import { Globe, Code } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Editor from '@monaco-editor/react';

interface StepOptions {
    isEditing?: boolean;
}

export const getEnvironmentConfigSteps = ({ isEditing = false }: StepOptions = {}) => [
    {
        id: 'basic',
        label: 'Basic Config',
        description: 'Environment Name',
        longDescription: 'Set the unique name for this environment configuration.',
        icon: Globe,
        component: ({ form }: any) => (
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Environment Name</Label>
                    <Input
                        {...form.register("env_name")}
                        placeholder="e.g. production, staging, dev"
                        className="h-10"
                        disabled={isEditing}
                        readOnly={isEditing}
                    />
                    {isEditing
                        ? <p className="text-[10px] text-muted-foreground italic">Name cannot be changed. Delete and recreate to rename.</p>
                        : <p className="text-[10px] text-muted-foreground italic">Used as the filename: {'{name}'}.yaml</p>
                    }
                </div>
            </div>
        )
    },
    {
        id: 'values',
        label: 'Value Overrides',
        description: 'YAML values',
        longDescription: 'Provide YAML value overrides for this environment.',
        icon: Code,
        component: ({ form }: any) => {
            const values = form.watch("values");
            return (
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Values (YAML)</Label>
                        <div className="h-[400px] rounded-xl border border-slate-800 bg-[#1e1e1e] overflow-hidden shadow-inner">
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                theme="vs-dark"
                                value={values}
                                onChange={(val) => form.setValue("values", val || "")}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                    padding: { top: 16, bottom: 16 },
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }
];

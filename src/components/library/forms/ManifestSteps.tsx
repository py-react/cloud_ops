import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Label } from "@/components/ui/label";
import Editor from '@monaco-editor/react';

export const getManifestSteps = () => [
    {
        id: 'manifest',
        label: 'K8s Manifest',
        description: 'templates/app.yaml',
        longDescription: 'Define all Kubernetes resources for this chart in a single file, separated by ---.',
        icon: LayoutTemplate,
        component: ({ form }: any) => {
            const content = form.watch('content');
            return (
                <div className="space-y-2 pt-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        templates/app.yaml
                    </Label>
                    <div className="h-[500px] rounded-xl border border-slate-800 bg-[#1e1e1e] overflow-hidden shadow-inner">
                        <Editor
                            height="100%"
                            language="yaml"
                            theme="vs-dark"
                            value={content}
                            onChange={(val) => form.setValue('content', val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                padding: { top: 16, bottom: 16 },
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                cursorBlinking: 'smooth',
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        Separate multiple resources with <code className="font-mono">---</code>
                    </p>
                </div>
            );
        }
    }
];

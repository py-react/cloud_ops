import React from 'react';
import { Settings } from 'lucide-react';
import { Label } from "@/components/ui/label";
import Editor from '@monaco-editor/react';

export const getDefaultsSteps = () => [
    {
        id: 'defaults',
        label: 'Default Values',
        description: 'values.yaml',
        longDescription: 'Define base configuration values that will be used by all environments unless overridden.',
        icon: Settings,
        component: ({ form }: any) => {
            const content = form.watch('content');
            return (
                <div className="space-y-2 pt-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        values.yaml
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
                </div>
            );
        }
    }
];

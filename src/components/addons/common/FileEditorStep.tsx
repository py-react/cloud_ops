import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export const FileEditorStep = ({ control, setValue, watch, label, fileName, name = 'config' }: any) => {
    const contentValue = watch(name) || '';

    return (
        <div className="space-y-4 h-[450px]">
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                        <FormLabel className="text-muted-foreground font-medium mb-2">{fileName || 'file.txt'}</FormLabel>
                        <FormControl>
                            <div className="flex-1 rounded-2xl overflow-hidden border border-border/50 bg-[#1e1e1e] shadow-inner">
                                <MonacoEditor
                                    height="100%"
                                    defaultLanguage="yaml"
                                    theme="vs-dark"
                                    value={contentValue}
                                    onChange={(value) => setValue(name, value)}
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
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-900/70">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p className="text-xs leading-relaxed">
                    {label || 'Please ensure the content is valid before saving.'}
                </p>
            </div>
        </div>
    );
};

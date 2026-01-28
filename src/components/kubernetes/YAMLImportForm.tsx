import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export const YAMLImportForm = ({ control, setValue, watch }: any) => {
    const yamlValue = watch('manifest') || '';

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="manifest"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Kubernetes YAML Manifest</FormLabel>
                        <FormControl>
                            <div className="h-[400px] border rounded-xl overflow-hidden bg-[#1e1e1e]">
                                <MonacoEditor
                                    height="100%"
                                    defaultLanguage="yaml"
                                    theme="vs-dark"
                                    value={yamlValue}
                                    onChange={(value) => setValue('manifest', value)}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 2,
                                    }}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

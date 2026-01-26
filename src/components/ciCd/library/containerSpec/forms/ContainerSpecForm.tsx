import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

export const BasicConfig = ({ control, setValue, watch }: { control: any; setValue: any; watch: any }) => {
    // Watch the config field to get real-time updates
    const configValue = watch("config") || "";

    // Track if update came from editor to prevent loops
    const isEditorUpdate = useRef(false);

    // Local state for editor (to handle typing smoothly)
    const [editorValue, setEditorValue] = useState(configValue);

    // Sync external form changes to editor (e.g., form reset, paste button)
    useEffect(() => {
        if (!isEditorUpdate.current) {
            setEditorValue(configValue || "");
        }
        isEditorUpdate.current = false;
    }, [configValue]);

    const handleYamlPaste = async () => {
        try {
            const yamlText = await navigator.clipboard.readText();

            // Parse YAML
            const parsedYaml = yaml.load(yamlText);

            // Convert to JSON string
            const jsonString = JSON.stringify(parsedYaml, null, 2);

            setEditorValue(jsonString);
            setValue("config", jsonString);

            toast.success("YAML converted and pasted");
        } catch (error) {
            toast.error("Failed to paste or convert YAML");
            console.error("Error:", error);
        }
    };

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value !== undefined) {
            isEditorUpdate.current = true;
            setEditorValue(value);
            setValue("config", value, { shouldDirty: true, shouldTouch: true });
        }
    }, [setValue]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Spec Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Profile name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Spec Type</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., micro, standard, large" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={control}
                name="config"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between mb-3">
                            <FormLabel>Spec Config (JSON)</FormLabel>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleYamlPaste}
                                    className="h-8"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Paste YAML
                                </Button>
                            </div>
                        </div>
                        <FormControl>
                            <div className="border border-border rounded-md overflow-hidden h-72">
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    value={editorValue}
                                    onChange={handleEditorChange}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        wordWrap: "on",
                                        formatOnPaste: true,
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
    )
}

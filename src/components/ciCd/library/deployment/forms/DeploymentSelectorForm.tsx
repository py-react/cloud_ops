import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, List, Tag, Cpu, Globe } from "lucide-react";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

export const SelectorBasicConfig = ({ control, setValue, watch, namespace }: { control: any; setValue: any; watch: any; namespace: string }) => {
    const configValue = watch("config") || "";
    const isEditorUpdate = useRef(false);
    const [editorValue, setEditorValue] = useState(configValue);

    useEffect(() => {
        if (!isEditorUpdate.current) {
            setEditorValue(configValue || "");
        }
        isEditorUpdate.current = false;
    }, [configValue]);

    const handleYamlPaste = async () => {
        try {
            const yamlText = await navigator.clipboard.readText();
            const parsedYaml = yaml.load(yamlText);
            const jsonString = JSON.stringify(parsedYaml, null, 2);
            setEditorValue(jsonString);
            setValue("config", jsonString);
            toast.success("YAML converted and pasted");
        } catch (error) {
            toast.error("Failed to paste or convert YAML");
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Basic Configuration */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Basic Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Selector Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Selector profile name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="namespace"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> Namespace <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} value={namespace} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Selector Configuration */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Selector Configuration</h3>
                </div>

                <FormField
                    control={control}
                    name="config"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between mb-3">
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    Selector Config (JSON)
                                </FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleYamlPaste}
                                    className="h-8 gap-2 font-semibold"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Paste YAML
                                </Button>
                            </div>
                            <FormControl>
                                <div className="border border-border/40 rounded-xl overflow-hidden h-72">
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
                                            padding: { top: 16, bottom: 16 }
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

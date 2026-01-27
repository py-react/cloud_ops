import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Container, Cpu, X, Info, Command, Terminal, FileTerminal, List, FileText, Layers, Settings2, Tag, Globe } from "lucide-react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RequiredBadge } from "@/components/docker/network/forms/badges";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import { ProfileSelector } from "@/components/select-profile";
import { Editor } from '@monaco-editor/react';
import YAML from 'js-yaml';
import { toast } from "sonner";
import { Control, UseFormSetValue, UseFormWatch, UseFormReturn } from "react-hook-form";
import { Tabs } from "@/components/ui/tabs";
import { ResourceDetailView } from "../../ResourceDetailView";

function jsonToYaml(obj: any) {
    return YAML.dump(obj, { sortKeys: false });
}

const defaultValues = {
    name: "",
    namespace: "",
    description: "",
    image_pull_policy: "IfNotPresent",
    command: new Set(),
    args: new Set(),
    working_dir: "",
    profile: {},
    tty: false,
    stdin: false,
};

export const BasicConfig = ({ control, setValue, watch, form, namespace }: { control: Control<typeof defaultValues, any, typeof defaultValues>, setValue: UseFormSetValue<typeof defaultValues>, watch: UseFormWatch<typeof defaultValues>, form: UseFormReturn<typeof defaultValues, any, typeof defaultValues>, namespace: string }) => {

    const profileWatch = watch("profile")
    const argsWatch = watch("args")
    const cmdWatch = watch("command")

    const [selectedProfile, setSelctedProfile] = useState({})

    const [attributeInput, setAttributeInput] = useState('');
    const [args, setArgs] = useState('');
    const [cmd, setCmd] = useState('');

    const handleAdd = (handleFor: "args" | "command") => {
        const val = form.getValues(handleFor)
        if (val.has(args)) return
        if (handleFor === "args") {
            val.add(args)
            setArgs("")
        } else {
            val.add(cmd)
            setCmd("")
        }
        setValue(handleFor, val)
    }

    const handleKeyDown = (e: React.KeyboardEvent, handleFor: "args" | "command") => {
        if (e.key === "enter") {
            handleAdd(handleFor)
        }
    }

    const handleAddBranch = () => {
        const oldVal = form.getValues("profile") as Record<string, any>;
        oldVal[attributeInput] = selectedProfile;
        setValue("profile", oldVal);
        setAttributeInput("");
        setSelctedProfile({});
    };

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
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Container Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Container name" {...field} />
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
                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 opacity-60" /> Description <RequiredBadge />
                            </FormLabel>
                            <FormControl>
                                <Textarea rows={3} placeholder="Use this when deploying on.." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Lifecycle & Execution */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Lifecycle & Execution</h3>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border/40 bg-background/50 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <FileTerminal className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-widest">
                                Commands
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {((cmdWatch instanceof Set ? cmdWatch.size : ((cmdWatch as any)?.length || 0)) > 0) && (cmdWatch instanceof Set ? Array.from(cmdWatch) : ((cmdWatch as any) || [])).map((field: any) => (
                                <Badge
                                    key={field}
                                    variant="outline"
                                    className="pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary group font-mono text-xs font-semibold"
                                >
                                    <span>{field}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const oldVal = form.getValues("command")
                                            if (oldVal instanceof Set) {
                                                const newVal = new Set(oldVal);
                                                newVal.delete(field);
                                                setValue("command", newVal);
                                            } else {
                                                setValue("command", ((oldVal as any) || []).filter((f: any) => f !== field));
                                            }
                                        }}
                                        className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-destructive" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="w-full flex gap-2">
                            <Input
                                placeholder='e.g. ["./app", "serve"]'
                                value={cmd}
                                onKeyDown={(e) => handleKeyDown(e, "command")}
                                onChange={(e) => setCmd(e.target.value)}
                                className="bg-background"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleAdd("command")}
                                className="h-10 px-4 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border/40 bg-background/50 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                            <Terminal className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-widest">
                                Arguments
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {((argsWatch instanceof Set ? argsWatch.size : ((argsWatch as any)?.length || 0)) > 0) && (argsWatch instanceof Set ? Array.from(argsWatch) : ((argsWatch as any) || [])).map((field: any) => (
                                <Badge
                                    key={field}
                                    variant="outline"
                                    className="pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary group font-mono text-xs font-semibold"
                                >
                                    <span>{field}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const oldVal = form.getValues("args")
                                            if (oldVal instanceof Set) {
                                                const newVal = new Set(oldVal);
                                                newVal.delete(field);
                                                setValue("args", newVal);
                                            } else {
                                                setValue("args", ((oldVal as any) || []).filter((f: any) => f !== field));
                                            }
                                        }}
                                        className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-destructive" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="w-full flex gap-2">
                            <Input
                                placeholder='e.g. worker.py'
                                value={args}
                                onKeyDown={(e) => handleKeyDown(e, "args")}
                                onChange={(e) => setArgs(e.target.value)}
                                className="bg-background"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleAdd("args")}
                                className="h-10 px-4 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="image_pull_policy"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Image Pull Policy <RequiredBadge /></FormLabel>
                                    <FormControl>
                                        <Input placeholder="IfNotPresent" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="working_dir"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">Working Directory</FormLabel>
                                    <FormControl>
                                        <Input placeholder="/app" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Configuration (Composition) */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Composition (Attributes)</h3>
                </div>
                <p className="text-xs text-muted-foreground font-medium pb-2">
                    Attach additional specifications from Container Specs under specific keys.
                </p>

                {Object.keys(profileWatch).length > 0 && (
                    <div className="p-4 rounded-xl border border-border/40 bg-background/50 space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(profileWatch).map((field: any) => {
                                const pw = profileWatch as Record<string, any>;
                                return (
                                    <Badge
                                        key={pw[field].id}
                                        variant="outline"
                                        className={cn(
                                            "pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all group",
                                            "font-mono text-xs font-semibold"
                                        )}
                                    >
                                        <span>{field}: {pw[field].name} ({pw[field].type})</span>
                                        <div className="w-px h-3 bg-primary/20 mx-0.5" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const oldVal = form.getValues("profile") as Record<string, any>;
                                                delete oldVal[field]
                                                setValue("profile", oldVal)
                                            }}
                                            className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                                        >
                                            <X className="h-3 w-3 text-destructive" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-end justify-between w-full gap-4 pt-2">
                    <div className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Attribute (e.g., resources)"
                                value={attributeInput}
                                onChange={(e) => setAttributeInput(e.target.value)}
                                className="h-10 pl-10 bg-background border-border/40 focus-visible:ring-primary/20"
                            />
                        </div>

                        <div className="flex-1">
                            <ProfileSelector selectedProfile={selectedProfile} onSelectProfile={setSelctedProfile} />
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddBranch}
                        className="h-10 px-4 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    >
                        <Plus className="h-4 w-4" />
                        Add Attribute
                    </Button>
                </div>

                {Object.keys(profileWatch).length === 0 && (
                    <div className="p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
                        <Container className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground">No attribute configured yet</p>
                    </div>
                )}
            </div>

            {/* Advanced Flags */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Advanced Flags</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={control}
                        name="tty"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/30 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">TTY</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">
                                        Allocate a pseudo-TTY
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="stdin"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border border-border/30 p-3 bg-background/50 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Interactive (Stdin)</FormLabel>
                                    <FormDescription className="text-[10px] font-medium leading-none text-muted-foreground/60">
                                        Keep stdin open
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    )
}

export const AdvancedConfig = ({ control, setValue, watch, form, canEdit = true }: { control: Control<typeof defaultValues, any, typeof defaultValues>, setValue: UseFormSetValue<typeof defaultValues>, watch: UseFormWatch<typeof defaultValues>, form: UseFormReturn<typeof defaultValues, any, typeof defaultValues>, canEdit?: boolean }) => {
    const [activeTab, setActiveTab] = useState("overview");
    // Track if update came from editor to prevent loops
    const isEditorUpdate = useRef(false);
    // Debounce toast warnings to prevent spam
    const lastWarningTime = useRef(0);

    // Get profile keys for comparison (these are read-only)
    const profileKeys = useMemo(() => {
        const profiles = control._formValues?.profile || {};
        return Object.keys(profiles);
    }, [control._formValues?.profile]);

    // Derive the YAML representation from form values and store original profile data
    const { formValues, originalProfileData } = useMemo(() => {
        const objectFromFormValue = { ...control._formValues }
        const profiles = { ...objectFromFormValue.profile } as Record<string, any>;
        const profileData: Record<string, any> = {};

        objectFromFormValue.command = Array.from(control._formValues.command || [])
        objectFromFormValue.args = Array.from(control._formValues.args || [])
        objectFromFormValue.image = "<IMAGE_NAME_FILLED_AT_RUNTIME>"
        Object.keys(profiles).map(key => {
            try {
                const parsed = JSON.parse(profiles[key].config);
                objectFromFormValue[key] = parsed;
                profileData[key] = parsed;
            } catch (e) {
                objectFromFormValue[key] = profiles[key].config;
                profileData[key] = profiles[key].config;
            }
        })
        delete objectFromFormValue.profile
        delete objectFromFormValue.description
        return { formValues: objectFromFormValue, originalProfileData: profileData }
    }, [control._formValues])

    // Local state for the editor value
    const [editorValue, setEditorValue] = useState(jsonToYaml(formValues));

    // Sync form changes to editor (when not from editor)
    useEffect(() => {
        if (!isEditorUpdate.current) {
            setEditorValue(jsonToYaml(formValues));
        }
        isEditorUpdate.current = false;
    }, [formValues]);

    // Known editable fields - only these will be synced back to form
    const knownEditableFields = useMemo(() =>
        new Set(['name', 'image_pull_policy', 'working_dir', 'command', 'args', 'image', 'namespace', 'tty', 'stdin']),
        []);

    // Handle editor changes - parse YAML and update form fields
    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value === undefined || !canEdit) return;

        isEditorUpdate.current = true;
        setEditorValue(value);

        // Try to parse YAML and update basic form fields
        try {
            const parsed = YAML.load(value) as any;
            if (parsed && typeof parsed === 'object') {
                const now = Date.now();

                // Check for profile key modifications or extra attributes
                const parsedKeys = Object.keys(parsed);
                for (const key of parsedKeys) {
                    // Check if it's a profile key that was modified
                    if (profileKeys.includes(key)) {
                        const originalValue = JSON.stringify(originalProfileData[key]);
                        const newValue = JSON.stringify(parsed[key]);
                        if (originalValue !== newValue && now - lastWarningTime.current > 3000) {
                            lastWarningTime.current = now;
                            toast.warning("Profile attributes are read-only", {
                                description: `Changes to "${key}" will not be saved. Edit the profile in Basic Info step.`,
                            });
                            break;
                        }
                    }
                    // Check if it's an unknown/extra attribute
                    else if (!knownEditableFields.has(key) && now - lastWarningTime.current > 3000) {
                        lastWarningTime.current = now;
                        toast.warning("Unknown attribute will not be saved", {
                            description: `"${key}" is not a recognized field. Only name, command, args, image_pull_policy, working_dir, tty, and stdin can be edited here.`,
                        });
                        break;
                    }
                }

                // Update basic fields that can be safely mapped back
                if (parsed.name !== undefined && parsed.name !== control._formValues.name) {
                    setValue('name', parsed.name);
                }
                if (parsed.image_pull_policy !== undefined && parsed.image_pull_policy !== control._formValues.image_pull_policy) {
                    setValue('image_pull_policy', parsed.image_pull_policy);
                }
                if (parsed.working_dir !== undefined && parsed.working_dir !== control._formValues.working_dir) {
                    setValue('working_dir', parsed.working_dir);
                }
                if (parsed.tty !== undefined && parsed.tty !== control._formValues.tty) {
                    setValue('tty', parsed.tty);
                }
                if (parsed.stdin !== undefined && parsed.stdin !== control._formValues.stdin) {
                    setValue('stdin', parsed.stdin);
                }
                // Update command (convert array to Set)
                if (Array.isArray(parsed.command)) {
                    const currentCommand = Array.from(control._formValues.command || []);
                    if (JSON.stringify(parsed.command) !== JSON.stringify(currentCommand)) {
                        setValue('command', new Set(parsed.command));
                    }
                }
                // Update args (convert array to Set)
                if (Array.isArray(parsed.args)) {
                    const currentArgs = Array.from(control._formValues.args || []);
                    if (JSON.stringify(parsed.args) !== JSON.stringify(currentArgs)) {
                        setValue('args', new Set(parsed.args));
                    }
                }
            }
        } catch (e) {
            // Invalid YAML - don't update form, just keep editor value
        }
    }, [setValue, control._formValues, canEdit, profileKeys, originalProfileData, knownEditableFields]);

    const structuredData = useMemo(() => {
        return {
            name: (control._formValues.name as string) || "Unnamed Container",
            description: control._formValues.description as string,
            namespace: control._formValues.namespace as string,
            image: control._formValues.image as string,
            image_pull_policy: control._formValues.image_pull_policy as string,
            command: Array.from(control._formValues.command || []) as string[],
            args: Array.from(control._formValues.args || []) as string[],
            working_dir: control._formValues.working_dir as string,
            tty: control._formValues.tty as boolean,
            stdin: control._formValues.stdin as boolean,
            dynamic_attr: control._formValues.profile
        };
    }, [control._formValues]);

    return (
        <div className="flex-1 h-[440px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <Tabs
                    variant="pill"
                    tabs={[
                        { id: "overview", label: "Overview" },
                        { id: "yaml", label: "YAML View" }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === "overview" ? (
                    <ResourceDetailView data={structuredData} type="container" />
                ) : (
                    <div className="h-full rounded-xl overflow-hidden border border-border/30">
                        <Editor
                            height="100%"
                            width="100%"
                            defaultLanguage="yaml"
                            value={editorValue}
                            theme="vs-dark"
                            onChange={canEdit ? handleEditorChange : undefined}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                tabSize: 2,
                                insertSpaces: true,
                                folding: true,
                                lineDecorationsWidth: 10,
                                lineNumbersMinChars: 3,
                                renderLineHighlight: 'all',
                                selectOnLineNumbers: true,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                padding: { top: 16, bottom: 16 },
                                formatOnPaste: true,
                                formatOnType: true,
                                readOnly: !canEdit,
                            }}
                            loading={
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Loading editor...
                                </div>
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useContext, useState } from "react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { Tag, Boxes, Package, FileCog, Check, ChevronsUpDown, Folder } from "lucide-react";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/libs/utils";

interface BasicConfigStepProps {
    form: UseFormReturn<any>;
}

const BasicConfigStep: React.FC<BasicConfigStepProps> = ({ form }) => {
    const { namespaces } = useContext(NamespaceContext);
    const [open, setOpen] = useState(false);
    const category = form.watch('category');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
            {/* Full width Config Name */}
            <FormField
                control={form.control}
                name="deployment_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            <FileCog className="h-3.5 w-3.5 opacity-60" /> Release Config Name *
                        </FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="e.g., my-app-release"
                                className="h-11 bg-background border-border/40 focus-visible:ring-primary/20"
                            />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                            A unique identifier for this release configuration.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {category === 'kubernetes' && (
                <FormField
                    control={form.control}
                    name="namespace"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Boxes className="h-3.5 w-3.5 opacity-60" /> Target Namespace *
                            </FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between h-11 bg-background border-border/40 text-sm font-medium",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4 opacity-50" />
                                                {field.value
                                                    ? namespaces.find(
                                                        (ns) => ns.metadata.name === field.value
                                                    )?.metadata.name || field.value
                                                    : "Select namespace"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search namespace..." className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>No namespace found.</CommandEmpty>
                                            <CommandGroup>
                                                {namespaces.map((ns) => (
                                                    <CommandItem
                                                        value={ns.metadata.name}
                                                        key={ns.metadata.name}
                                                        onSelect={() => {
                                                            form.setValue("namespace", ns.metadata.name);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Folder className="mr-2 h-4 w-4 opacity-50" />
                                                        {ns.metadata.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                ns.metadata.name === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormDescription className="text-[10px]">
                                Choose which logical environment (namespace) this configuration belongs to.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {/* Category and Type next to each other */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 opacity-60" /> Library Release
                            </FormLabel>
                            <FormControl>
                                <div className={cn(
                                    "flex items-center justify-between h-11 border border-border/40 px-4 bg-card/10 rounded-md",
                                    form.getValues('id') && "opacity-60 grayscale-[0.5]"
                                )}>
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                        {form.getValues('id') 
                                            ? "Category cannot be changed after creation" 
                                            : "Enable non-K8s package mode"}
                                    </span>
                                    <Switch
                                        disabled={!!form.getValues('id')}
                                        checked={field.value === 'package'}
                                        onCheckedChange={(checked) => field.onChange(checked ? 'package' : 'kubernetes')}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Toggle for library distributions.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 opacity-60" /> Type *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., web-app, api"
                                    className="h-11 bg-background border-border/40 focus-visible:ring-primary/20"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Categorize the release (e.g. microservice).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

export default BasicConfigStep;

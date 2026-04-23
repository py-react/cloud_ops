import React from "react";
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
import { Tag, Boxes, Package, FileCog } from "lucide-react";

interface BasicConfigStepProps {
    form: UseFormReturn<any>;
}

const BasicConfigStep: React.FC<BasicConfigStepProps> = ({ form }) => {
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
                                <div className="flex items-center justify-between h-11 border border-border/40 px-4 bg-card/10 rounded-md">
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                        Enable non-K8s package mode
                                    </span>
                                    <Switch
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

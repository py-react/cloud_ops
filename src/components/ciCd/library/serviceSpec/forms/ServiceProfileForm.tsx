import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, List, Tag, Globe, Shield, Zap } from "lucide-react";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

export const ServiceProfileForm = ({ form, namespace }: { form: any, namespace: string }) => {
    const ports = form.watch("config.ports") || [];

    const addPort = () => {
        form.setValue("config.ports", [...ports, { name: "", port: 80, targetPort: 80, protocol: "TCP" }]);
    };

    const removePort = (index: number) => {
        form.setValue("config.ports", ports.filter((_: any, i: number) => i !== index));
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
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-60" /> Profile Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. standard-web-service" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="namespace"
                        render={({ field }) => (
                            <FormItem>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="config.type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 opacity-60" /> Service Type <RequiredBadge />
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ClusterIP">ClusterIP</SelectItem>
                                        <SelectItem value="NodePort">NodePort</SelectItem>
                                        <SelectItem value="LoadBalancer">LoadBalancer</SelectItem>
                                        <SelectItem value="ExternalName">ExternalName</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Network Configuration (Ports) */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Network Configuration</h3>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPort}
                        className="h-8 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add Port
                    </Button>
                </div>

                <div className="space-y-3">
                    {ports.map((_: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 rounded-xl border border-border/40 bg-background/50 shadow-sm relative group">
                            <FormField
                                control={form.control}
                                name={`config.ports.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="http" {...field} className="h-8 bg-background" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`config.ports.${index}.port`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Port</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                className="h-8 bg-background"
                                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`config.ports.${index}.targetPort`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Target Port</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="80"
                                                {...field}
                                                className="h-8 bg-background"
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    field.onChange(isNaN(Number(val)) ? val : Number(val));
                                                }}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-end gap-2">
                                <FormField
                                    control={form.control}
                                    name={`config.ports.${index}.protocol`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Protocol</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-8 bg-background"><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="TCP">TCP</SelectItem>
                                                    <SelectItem value="UDP">UDP</SelectItem>
                                                    <SelectItem value="SCTP">SCTP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => removePort(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {ports.length === 0 && (
                        <div className="p-8 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
                            <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs font-bold text-muted-foreground">No ports defined yet</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-1">Add a port mapping to expose your service</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

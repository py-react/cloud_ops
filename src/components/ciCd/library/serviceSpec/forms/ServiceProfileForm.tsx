import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export const ServiceProfileForm = ({ form }: { form: any }) => {
    const ports = form.watch("config.ports") || [];

    const addPort = () => {
        form.setValue("config.ports", [...ports, { name: "", port: 80, targetPort: 80, protocol: "TCP" }]);
    };

    const removePort = (index: number) => {
        form.setValue("config.ports", ports.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Profile Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. standard-web-service" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
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

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <FormLabel>Ports</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={addPort}>
                        <Plus className="h-4 w-4 mr-2" /> Add Port
                    </Button>
                </div>

                {ports.map((_: any, index: number) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end border p-3 rounded-lg bg-muted/30">
                        <FormField
                            control={form.control}
                            name={`config.ports.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Name</FormLabel>
                                    <FormControl><Input placeholder="http" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`config.ports.${index}.port`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Port</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
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
                                    <FormLabel className="text-xs">Target Port</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="80"
                                            {...field}
                                            onChange={e => {
                                                const val = e.target.value;
                                                field.onChange(isNaN(Number(val)) ? val : Number(val));
                                            }}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name={`config.ports.${index}.protocol`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="text-xs">Protocol</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Button type="button" variant="ghost" size="icon" className="mt-6" onClick={() => removePort(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
                {ports.length === 0 && (
                    <div className="text-center py-4 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                        No ports defined.
                    </div>
                )}
            </div>
        </div>
    );
};

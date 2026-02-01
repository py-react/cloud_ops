import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Globe, User, Key, Link } from "lucide-react";
import { RequiredBadge } from "@/components/docker/network/forms/badges";

export const RegistryForm = ({ control, watch, isEditing }: { control: any, watch: any, isEditing: boolean }) => {
    const type = watch("type");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-black">Registry Configuration</h3>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    Registry Type <RequiredBadge />
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isEditing}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="remote">Remote Registry (Docker Hub, Harbor)</SelectItem>
                                        <SelectItem value="k8s">Kubernetes Hosted (Deploy New)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 opacity-60" /> Registry Name <RequiredBadge />
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="my-registry" {...field} disabled={isEditing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {type === "remote" && (
                        <>
                            <FormField
                                control={control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                            <Link className="h-3.5 w-3.5 opacity-60" /> Registry URL <RequiredBadge />
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="registry.example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 opacity-60" /> Username
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                                <Key className="h-3.5 w-3.5 opacity-60" /> Password / Token
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder={isEditing ? "(Unchanged)" : "Optional"} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </>
                    )}

                    {type === "k8s" && (
                        <FormField
                            control={control}
                            name="namespace"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 opacity-60" /> Namespace <RequiredBadge />
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="image-registry" {...field} disabled={isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

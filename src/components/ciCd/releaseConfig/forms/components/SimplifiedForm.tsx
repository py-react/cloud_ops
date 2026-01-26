import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Settings, Container, Hash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData } from "./formUtils";

interface SimplifiedFormProps {
    form: UseFormReturn<DeploymentFormData, any>;
}

const SimplifiedForm: React.FC<SimplifiedFormProps> = ({ form }) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="shadow-none border bg-muted/10">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="deployment_name"
                        render={({ field }) => (
                            <FormItem>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Deployment Name</Label>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. my-service-api" className="h-10 font-medium" />
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
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Namespace</Label>
                                <FormControl>
                                    <Input {...field} placeholder="default" className="h-10 font-medium" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card className="shadow-none border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Container className="h-4 w-4 text-primary" />
                        Primary Container
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="containers.0.image"
                        render={({ field }) => (
                            <FormItem>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Container Image (Template)</Label>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. nginx:latest" className="h-10 font-mono text-sm" />
                                </FormControl>
                                <FormDescription className="text-[10px] font-medium italic">
                                    This image will be used as a template for new releases.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="replicas"
                            render={({ field }) => (
                                <FormItem>
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5" />
                                        Instance Count (Replicas)
                                    </Label>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-10 font-medium"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Application Type</Label>
                                    <FormControl>
                                        <Input {...field} placeholder="web-app" className="h-10 font-medium" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">💡 Pro-Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Switch to <span className="text-foreground font-bold">Advanced YAML</span> mode in the top toggle to configure volumes, networking, and advanced scheduling rules.
                </p>
            </div>
        </div>
    );
};

export default SimplifiedForm;

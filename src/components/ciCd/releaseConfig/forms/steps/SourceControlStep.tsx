import React, { useState, useEffect } from "react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { GitBranch } from "lucide-react";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

interface SourceControlStepProps {
    form: UseFormReturn<any>;
}

const SourceControlStep: React.FC<SourceControlStepProps> = ({ form }) => {
    const category = form.watch("category");
    const requiredSourceControl = form.watch("required_source_control") || false;
    const selectedRepo = form.watch("code_source_control_name");
    const [sourceControls, setSourceControls] = useState<any[]>([]);
    const [branchesMap, setBranchesMap] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);

    const isPackage = category === 'package';
    const availableBranches = selectedRepo ? (branchesMap[selectedRepo] || []) : [];

    useEffect(() => {
        fetchSourceControls();
    }, []);

    // Force required_source_control if it's a package release
    useEffect(() => {
        if (isPackage && !requiredSourceControl) {
            form.setValue("required_source_control", true);
        }
    }, [isPackage, requiredSourceControl, form]);

    // Reset branch when repo changes (but not during initial load)
    useEffect(() => {
        if (loading) return;  // Don't reset while loading branches
        const currentBranch = form.getValues("source_control_branch");
        if (selectedRepo && currentBranch && availableBranches.length > 0) {
            const branchExists = availableBranches.some((b: any) => {
                const bName = typeof b === 'string' ? b : b.branch;
                return bName === currentBranch;
            });
            if (!branchExists) {
                form.setValue("source_control_branch", "");
            }
        }
    }, [selectedRepo, availableBranches, loading, form]);

    const fetchSourceControls = async () => {
        try {
            setLoading(true);
            const res: any = await DefaultService.apiIntegrationGithubPollingGet();
            if (res && res.allowed_branches) {
                setBranchesMap(res.allowed_branches);
                const repos = Object.keys(res.allowed_branches).map(name => ({ name }));
                setSourceControls(repos);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch source controls");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
            <FormField
                control={form.control}
                name="required_source_control"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between pb-6 mb-6 border-b border-border/40">
                        <div className="space-y-0.5">
                            <FormLabel className="text-xs font-black uppercase tracking-wider text-foreground">
                                Required Source Control
                            </FormLabel>
                            <FormDescription className="text-[10px]">
                                {isPackage 
                                    ? "Mandatory for library releases to ensure build traceability." 
                                    : "Link this release to a Git repository for automated builds."}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPackage}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {requiredSourceControl && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    {/* Repository Selection - Full Width */}
                    <FormField
                        control={form.control}
                        name="code_source_control_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                    <GitBranch className="h-3.5 w-3.5 opacity-60" /> Source Repository *
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                <SelectValue placeholder={loading ? "Loading..." : "Select a repository"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sourceControls.map((sc) => (
                                                <SelectItem key={sc.name} value={sc.name}>
                                                    {sc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {field.value && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange(null);
                                                form.setValue("source_control_branch", null);
                                            }}
                                            className="px-3 h-11 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                                            title="Clear selection"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Branch Selection - Full Width */}
                    {selectedRepo && (
                        <FormField
                            control={form.control}
                            name="source_control_branch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                        <GitBranch className="h-3.5 w-3.5 opacity-60" /> Default Branch *
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background border-border/40 shadow-sm">
                                                    <SelectValue placeholder="Select a branch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableBranches.length === 0 ? (
                                                    <SelectItem value="no-branches" disabled>No branches available</SelectItem>
                                                ) : (
                                                    availableBranches.map((branch: any) => {
                                                        const branchName = typeof branch === 'string' ? branch : branch.branch;
                                                        return (
                                                            <SelectItem key={branchName} value={branchName}>
                                                                {branchName}
                                                            </SelectItem>
                                                        );
                                                    })
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {field.value && (
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(null)}
                                                className="px-3 h-11 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                                                title="Clear selection"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default SourceControlStep;

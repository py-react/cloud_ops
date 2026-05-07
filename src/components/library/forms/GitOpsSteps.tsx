import React from 'react';
import { Github, Shield, Globe, Send, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/libs/utils";

const RepositoryStep = ({ form }: any) => (
    <div className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Repository Owner
                </Label>
                <Input 
                    {...form.register('repo_owner')}
                    placeholder="e.g. my-organization"
                    className="h-11 bg-muted/20 border-border/40 focus:ring-primary/20"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                    <Github className="h-3 w-3" /> Repository Name
                </Label>
                <Input 
                    {...form.register('repo_name')}
                    placeholder="e.g. charts-library"
                    className="h-11 bg-muted/20 border-border/40 focus:ring-primary/20"
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                <Send className="h-3 w-3" /> Target Branch
            </Label>
            <Input 
                {...form.register('branch')}
                placeholder="main"
                className="h-11 bg-muted/20 border-border/40 font-mono text-sm"
            />
        </div>
    </div>
);

const AuthStep = ({ form, credentials }: any) => (
    <div className="space-y-6 py-4">
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GitHub Credentials</Label>
            <Select 
                value={form.watch('github_credential_id')?.toString()} 
                onValueChange={(v) => form.setValue('github_credential_id', parseInt(v))}
            >
                <SelectTrigger className="h-11 bg-muted/20 border-border/40">
                    <SelectValue placeholder="Select a personal access token" />
                </SelectTrigger>
                <SelectContent>
                    {credentials.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                            <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-primary" />
                                <span className="font-bold">{c.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-inner">
                    <RefreshCw className={cn("h-6 w-6 text-primary", form.watch('auto_push') && "animate-spin-slow")} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground tracking-tight">Auto-Sync Mode</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px]">Automatically synchronize every local change with GitHub.</p>
                </div>
            </div>
            <Switch 
                checked={form.watch('auto_push')}
                onCheckedChange={(v) => form.setValue('auto_push', v)}
            />
        </div>
    </div>
);

export const getGitOpsSteps = (credentials: any[]) => [
    {
        id: 'repository',
        label: 'Repository',
        icon: Github,
        description: 'Target repository details',
        longDescription: 'Specify the owner and name of the GitHub repository where your charts are stored.',
        component: RepositoryStep
    },
    {
        id: 'auth',
        label: 'Authentication',
        icon: Shield,
        description: 'Credentials and sync strategy',
        longDescription: 'Configure access tokens and determine how changes are synchronized with the remote repository.',
        component: AuthStep,
        props: { credentials }
    }
];

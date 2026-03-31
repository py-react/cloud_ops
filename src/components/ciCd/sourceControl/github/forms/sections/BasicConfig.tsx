import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFieldArray } from 'react-hook-form';
import { X, Plus, GitBranch, Key, Database, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DefaultService } from '@/gingerJs_api_client';

interface SectionProps {
  control: any;
  errors: any;
  watch: any;
  setValue: any;
}

const RequiredBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
    Required
  </span>
);

const BasicConfig: React.FC<SectionProps> = ({ control }) => {
  // Branches field array
  const { fields: branchFields, append, remove } = useFieldArray({
    control,
    name: 'branches',
  });

  const [branchInput, setBranchInput] = useState('');
  const [pats, setPats] = useState<any[]>([]);
  const [loadingPats, setLoadingPats] = useState(false);
  const [registries, setRegistries] = useState<any[]>([]);
  const [loadingRegistries, setLoadingRegistries] = useState(false);
  const [engines, setEngines] = useState<any[]>([]);
  const [loadingEngines, setLoadingEngines] = useState(false);

  useEffect(() => {
    const fetchPats = async () => {
      setLoadingPats(true);
      try {
        const res = await DefaultService.apiIntegrationGithubPatGet();
        setPats(res || []);
      } catch (err) {
        console.error("Failed to fetch PATs", err);
      } finally {
        setLoadingPats(false);
      }
    };
    const fetchRegistries = async () => {
      setLoadingRegistries(true);
      try {
        const res = await DefaultService.apiDockerRegistryGet({ mode: 'list' } as any);
        const data = res as any;
        if (data && data.registries) {
          setRegistries(data.registries);
        }
      } catch (err) {
        console.error("Failed to fetch registries", err);
      } finally {
        setLoadingRegistries(false);
      }
    };
    const fetchEngines = async () => {
      setLoadingEngines(true);
      try {
        const res = await DefaultService.apiSettingsDockerConfigGet();
        const data = res as any;
        if (Array.isArray(data)) {
          setEngines(data);
        }
      } catch (err) {
        console.error("Failed to fetch engines", err);
        // If API fails, still offer local engine as a fallback
        setEngines([{ id: 0, name: 'Local Engine (Default)', is_active: true, is_default: true }]);
      } finally {
        setLoadingEngines(false);
      }
    };
    fetchPats();
    fetchRegistries();
    fetchEngines();
  }, []);

  const handleAddBranch = () => {
    if (!branchInput.trim()) return;

    // Check for duplicates
    const exists = branchFields.some((field: any) => field.branch === branchInput.trim());
    if (exists) {
      return;
    }

    append({ branch: branchInput.trim(), registry_id: null, docker_config_id: null });
    setBranchInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBranch();
    }
  };

  return (
    <div className="space-y-8">
      {/* Repository Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold text-foreground">
              Repository Name <RequiredBadge />
            </FormLabel>
            <FormDescription className="text-xs text-muted-foreground font-medium">
              The full repository path (owner/repo)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="e.g., my-org/my-repo"
                {...field}
                className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PAT Selection */}
          <FormField
            control={control}
            name="pat_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-70">
                  Access Token
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                  value={field.value ? String(field.value) : "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl">
                      <SelectValue placeholder={loadingPats ? "Loading..." : "Select PAT"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none" className="text-muted-foreground italic text-xs">Public Repository</SelectItem>
                    {pats.map((pat) => (
                      <SelectItem key={pat.id} value={String(pat.id)} className="text-xs">
                        <div className="flex items-center gap-2">
                          <Key className="w-3 h-3 opacity-70" />
                          <span className="font-medium">{pat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Default Engine Selection */}
          <FormField
            control={control}
            name="docker_config_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-70">
                  Default Docker Engine
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "local" ? 0 : parseInt(value))}
                  value={field.value !== null && field.value !== undefined ? String(field.value) : "0"}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl font-medium">
                      <SelectValue placeholder={loadingEngines ? "Loading..." : "Select Engine"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {engines.map((engine) => (
                      <SelectItem key={engine.id} value={String(engine.id)} className="text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          <Settings2 className="w-3 h-3 opacity-70 text-purple-500" />
                          <span>{engine.name}</span>
                          {engine.is_active && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded-sm">Active</span>}
                          {engine.id === 0 && <span className="text-[8px] bg-slate-500/10 text-slate-500 px-1 rounded-sm">Default</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
      </div>

      {/* Default Registry Selection */}
      <FormField
        control={control}
        name="registry_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-70">
              Default Registry
            </FormLabel>
            <FormDescription className="text-xs text-muted-foreground font-medium mb-2">
              Default registry for all branches in this repository
            </FormDescription>
            <Select
              onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
              value={field.value !== null && field.value !== undefined ? String(field.value) : "none"}
            >
              <FormControl>
                <SelectTrigger className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl font-medium">
                  <SelectValue placeholder={loadingRegistries ? "Loading..." : "None"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground italic text-xs">None (Default Host)</SelectItem>
                {registries.map((reg) => (
                  <SelectItem key={reg.id} value={String(reg.id)} className="text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Database className="w-3 h-3 opacity-70 text-blue-500" />
                      <span>{reg.name}</span>
                      {reg.is_remote ? (
                        <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1 rounded-sm">Remote</span>
                      ) : (
                        <span className="text-[8px] bg-purple-500/10 text-purple-600 px-1 rounded-sm">K8s</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Allowed Branches - Advanced Management */}
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-border/30 pb-2 mb-4">
            <div>
              <FormLabel className="text-sm font-bold text-foreground">
                Branch Configurations <RequiredBadge />
              </FormLabel>
              <FormDescription className="text-[11px] text-muted-foreground font-medium">
                Individually configure engine and registry for each branch
              </FormDescription>
            </div>
        </div>

        {/* List of branch configurations */}
        <div className="space-y-3">
            {branchFields.map((field: any, index) => (
                <div key={field.id} className="group p-3 rounded-2xl border border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-border/60 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Branch Name Badge */}
                        <div className="flex items-center gap-2 min-w-[140px]">
                            <GitBranch className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono text-sm font-bold text-foreground truncate">{field.branch}</span>
                        </div>

                        {/* Registry Select */}
                        <div className="flex-1 flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-70 px-1">Registry</span>
                            <FormField
                                control={control}
                                name={`branches.${index}.registry_id`}
                                render={({ field: branchField }) => (
                                    <Select
                                        onValueChange={(value) => branchField.onChange(value === "default" ? null : parseInt(value))}
                                        value={branchField.value !== null && branchField.value !== undefined ? String(branchField.value) : "default"}
                                    >
                                        <SelectTrigger className="h-10 bg-background border-border/30 text-xs rounded-xl font-medium">
                                            <SelectValue placeholder="Repo Default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default" className="text-xs italic">Repository Default</SelectItem>
                                            {registries.map((reg) => (
                                                <SelectItem key={reg.id} value={String(reg.id)} className="text-xs">
                                                    {reg.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Engine Select */}
                        <div className="flex-1 flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-70 px-1">Build Engine</span>
                            <FormField
                                control={control}
                                name={`branches.${index}.docker_config_id`}
                                render={({ field: branchField }) => (
                                    <Select
                                        onValueChange={(value) => branchField.onChange(parseInt(value))}
                                        value={branchField.value !== null && branchField.value !== undefined ? String(branchField.value) : "0"}
                                    >
                                        <SelectTrigger className="h-10 bg-background border-border/30 text-xs rounded-xl font-medium">
                                            <SelectValue placeholder="Select Engine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {engines.map((engine) => (
                                                <SelectItem key={engine.id} value={String(engine.id)} className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        {engine.id === 0
                                                            ? <span className="text-slate-500">{engine.name}</span>
                                                            : <span>{engine.name}</span>
                                                        }
                                                        {engine.is_active && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded-sm">Active</span>}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Remove Button */}
                        <div className="pt-4 sm:pt-0 flex items-center justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Add new branch input */}
        <div className="flex gap-2 pt-4 border-t border-border/20 mt-6">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Add branch (e.g., main, staging)"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-10 pl-10 bg-muted/40 border-border/40 focus-visible:ring-primary/20 rounded-xl font-medium"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddBranch}
            disabled={!branchInput.trim()}
            className="h-10 px-4 gap-2 font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/20 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {branchFields.length === 0 && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-border/40 bg-muted/5 text-center transition-all hover:bg-muted/10">
            <GitBranch className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs font-bold text-muted-foreground">No branches configured</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 uppercase tracking-wider">Add your first branch to start CI workflows</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicConfig;
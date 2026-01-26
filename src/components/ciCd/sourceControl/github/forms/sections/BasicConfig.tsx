import React, { useState } from 'react';
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
import { X, Plus, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils';

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

  const handleAddBranch = () => {
    if (!branchInput.trim()) return;

    // Check for duplicates
    const exists = branchFields.some((field: any) => field.value === branchInput.trim());
    if (exists) {
      return; // Could show a toast here if needed
    }

    append({ value: branchInput.trim() });
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

      {/* Allowed Branches - Improved UI */}
      <div className="space-y-4">
        <div>
          <FormLabel className="text-sm font-bold text-foreground">
            Allowed Branches <RequiredBadge />
          </FormLabel>
          <FormDescription className="text-xs text-muted-foreground font-medium mt-1">
            Configure which branches can trigger CI workflows
          </FormDescription>
        </div>

        {/* Display configured branches as chips */}
        {branchFields.length > 0 && (
          <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-widest">
                Configured Branches ({branchFields.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {branchFields.map((field: any, index) => (
                <Badge
                  key={field.id}
                  variant="outline"
                  className={cn(
                    "pl-3 pr-2 py-1.5 gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all group",
                    "font-mono text-xs font-semibold"
                  )}
                >
                  <span>{field.value}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add new branch input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Branch name (e.g., main, develop, staging)"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-10 pl-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddBranch}
            disabled={!branchInput.trim()}
            className="h-10 px-4 gap-2 font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        </div>

        {branchFields.length === 0 && (
          <div className="p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-center">
            <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-bold text-muted-foreground">No branches configured yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Add your first branch above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicConfig;
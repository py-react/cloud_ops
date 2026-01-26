import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plug, ChevronRight, Loader2 } from 'lucide-react';
import BasicConfig from './sections/BasicConfig';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';
import { cn } from '@/libs/utils';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddRepositoryFormData {
  name: string;
  branches: { value: string }[];
}

interface AddRepositoryFormProps {
  onSuccess: () => void;
  initialValues?: AddRepositoryFormData;
  isEdit?: boolean;
}

const steps = [
  {
    id: 'basic',
    label: 'Repository Details',
    icon: Plug,
    description: 'General SCM settings',
    longDescription: 'Provide the name of the GitHub repository (owner/repo) and configure which branches should be allowed to trigger CI workflows via polling.',
    component: BasicConfig,
  },
];

const schema = z.object({
  name: z.string().min(1, 'Repository name is required'),
  branches: z.array(z.object({ value: z.string() })).min(1, 'At least one branch is required'),
});

const defaultValues: AddRepositoryFormData = {
  name: '',
  branches: [],
};

const AddRepositoryForm: React.FC<AddRepositoryFormProps> = ({ onSuccess, initialValues, isEdit }) => {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddRepositoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || defaultValues,
  });

  const handleSubmit = async (data: AddRepositoryFormData) => {
    if (submitting) return;
    setSubmitting(true);

    const allowed_branches = data.branches.map(b => b.value);

    try {
      let res;
      if (isEdit) {
        res = await DefaultService.apiIntegrationGithubReposPut({
          requestBody: { name: data.name, branches: allowed_branches }
        });
      } else {
        res = await DefaultService.apiIntegrationGithubReposPost({
          requestBody: { name: data.name, branches: allowed_branches }
        });
      }

      const body: any = res as any;
      if (body && body.success) {
        toast.success(body.message || (isEdit ? 'Repository updated' : 'Repository added'));
        onSuccess();
      } else {
        toast.error((body && body.message) || (isEdit ? 'Failed to update repository' : 'Failed to add repository'));
      }
    } catch (err: any) {
      toast.error(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
  } as any;

  const Icon = currentStepData.icon;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex shrink-0 min-h-0 h-[620px]">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-border/30 bg-muted/20 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveTab(step.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-left",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                    )}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate leading-none mb-1">{step.label}</div>
                      <div className="text-[11px] opacity-70 truncate leading-none font-medium">{step.description}</div>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="px-8 py-8 space-y-8 pb-12">
              {/* Standardized Header */}
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">{currentStepData.label}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                    {currentStepData.longDescription}
                  </p>
                </div>
              </div>

              {/* Main Form Area */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Form {...form}>
                  <form
                    id="add-repository-form"
                    className="space-y-8"
                    onSubmit={form.handleSubmit(handleSubmit)}
                  >
                    <CurrentStepComponent {...sectionProps} />
                  </form>
                </Form>
              </div>
            </div>
          </ScrollArea>

          {/* Sticky Footer */}
          <div className="py-3 px-8 bg-background/95 backdrop-blur-xl border-t border-border/40 flex justify-end items-center z-20 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                form="add-repository-form"
                type="submit"
                disabled={submitting}
                variant="default"
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plug className="h-4 w-4" />
                )}
                {isEdit ? 'Save Changes' : 'Add Repository'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRepositoryForm;
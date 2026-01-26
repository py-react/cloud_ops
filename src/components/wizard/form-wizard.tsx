import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Loader2, LucideProps, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { Button } from "../ui/button";
import { cn } from "@/libs/utils";
import { toast } from "sonner";

type TSteps<T extends FieldValues> = {
  id: string;
  label: string;
  icon?: any;
  description: string;
  longDescription: string;
  props?: Record<string, any>;
  component: React.FC<any>;
  hideSectionHeader?:boolean
  canNavigateNext?: (form: UseFormReturn<T>) => { can: boolean; message?: string };
};

type THeading = {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  actions?: React.ReactNode;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
};

export interface IFormWizard<T extends FieldValues> {
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  steps: TSteps<T>[];
  heading: THeading;
  currentStep: string;
  setCurrentStep: React.Dispatch<React.SetStateAction<string>>;
  initialValues: T;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  name: string;
  submitLabel?: string;
  submitIcon?: any;
  hideActions?: boolean;
}

export const FormWizard = <T extends FieldValues>({
  currentStep,
  setCurrentStep,
  isWizardOpen,
  steps,
  setIsWizardOpen,
  heading,
  initialValues,
  schema,
  onSubmit,
  name,
  submitLabel = "Submit",
  submitIcon: SubmitIcon,
  hideActions = false,
}: IFormWizard<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: initialValues as any,
  });

  // Sync form state when initialValues change or wizard opens
  React.useEffect(() => {
    if (isWizardOpen) {
      form.reset(initialValues as any);
    }
  }, [initialValues, isWizardOpen, form]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;
  const CurrentStepComponentProps = currentStepData.props || {};
  const Icon = currentStepData.icon || Info;

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true)
    await onSubmit(data);
    setIsSubmitting(false)
  };

  const handleNext = () => {
    if (currentStepData.canNavigateNext) {
      const { can, message } = currentStepData.canNavigateNext(form);
      if (!can) {
        if (message) toast.error(message);
        return;
      }
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleTabChange = (targetId: string) => {
    const targetIndex = steps.findIndex(s => s.id === targetId);
    if (targetIndex < currentStepIndex) {
      setCurrentStep(targetId);
      return;
    }

    // If moving forward, we must check all steps in between
    for (let i = currentStepIndex; i < targetIndex; i++) {
      const step = steps[i];
      if (step.canNavigateNext) {
        const { can, message } = step.canNavigateNext(form);
        if (!can) {
          if (message) toast.error(`Step "${step.label}" incomplete: ${message}`);
          return;
        }
      }
    }
    setCurrentStep(targetId);
  };

  return (
    <Dialog
      open={isWizardOpen}
      onOpenChange={(open) => {
        setIsWizardOpen(open);
        if (!open) setCurrentStep(steps[0].id);
      }}
    >
      <DialogContent className="sm:max-w-6xl p-0 overflow-hidden border border-border/30 bg-background shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500 max-h-[90vh]">
        <DialogHeader className="py-6 px-8 border-b border-border/30 bg-muted/30 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <heading.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <DialogTitle className="text-2xl font-bold tracking-tight">{heading.primary}</DialogTitle>
                {heading.secondary && (
                  <p className="text-xs text-muted-foreground font-medium">{heading.secondary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {heading.actions}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form id={name} onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col min-h-0 h-[620px]">
            <div className="flex shrink-0 min-h-0 overflow-hidden h-full">
              {/* Sidebar Navigation */}
              <div className="w-64 border-r border-border/30 bg-muted/20 flex flex-col shrink-0">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-1">
                    {steps.map((step) => {
                      const StepIcon = step.icon || Info;
                      const isActive = currentStep === step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleTabChange(step.id)}
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

              {/* Form Content Area */}
              <div className="flex-1 flex flex-col bg-background min-w-0 relative overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className={cn("px-8 py-8 space-y-8 pb-12")}>
                    {/* Header styled after Overview cards */}
                    {!currentStepData.hideSectionHeader && (
                      <div className={cn("flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300")}>
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
                    )}

                    {/* Main Form Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <CurrentStepComponent
                        {...CurrentStepComponentProps}
                        control={form.control}
                        watch={form.watch}
                        setValue={form.setValue}
                        errors={form.formState.errors}
                        form={form}
                      />
                    </div>
                  </div>
                </ScrollArea>
                {!hideActions &&(
                  // {/* Footer: Sticky, Standard sized buttons, right-aligned */}
                  <div className="py-3 px-8 bg-background/95 backdrop-blur-xl border-t border-border/40 flex justify-end items-center z-20 gap-3 shrink-0">
                    {currentStepIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-6 rounded-lg font-medium text-sm transition-all hover:bg-muted"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1].id)}
                      >
                        Back
                      </Button>
                    )}
                    {currentStepIndex < steps.length - 1 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-6 rounded-lg font-medium text-sm"
                        onClick={handleNext}
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="gradient"
                        className="h-9 px-8 rounded-lg shadow-sm font-semibold flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          SubmitIcon && <SubmitIcon className="h-4 w-4" />
                        )}
                        {submitLabel}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FormWizard;

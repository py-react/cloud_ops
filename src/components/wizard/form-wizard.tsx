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
import { TooltipWrapper } from "@/components/ui/tooltip";

type TSteps<T extends FieldValues> = {
  id: string;
  label: string;
  icon?: any;
  description: string;
  longDescription: string;
  props?: Record<string, any>;
  component: React.FC<any>;
  hideSectionHeader?: boolean;
  hideActions?: boolean;
  canNavigateNext?: (form: UseFormReturn<T>) => { can: boolean; message?: string };
  allowSubmit?: boolean;
  submitOnNext?: boolean;
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

  const wasOpenRef = React.useRef(isWizardOpen);

  // Sync form state only when wizard first opens (not on step changes)
  React.useEffect(() => {
    if (isWizardOpen && !wasOpenRef.current) {
      form.reset(initialValues as any);
    }
    wasOpenRef.current = isWizardOpen;
  }, [isWizardOpen, form]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;
  const CurrentStepComponentProps = currentStepData.props || {};
  const Icon = currentStepData.icon || Info;

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data);

      // If this step has submitOnNext or is handled via next, move forward
      if (currentStepData.submitOnNext && currentStepIndex < steps.length - 1) {
        const nextIndex = currentStepIndex + 1;
        setCurrentStep(steps[nextIndex].id);
      }
    } catch (error) {
      // Error handled by the caller/onSubmit usually via toast
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="py-4 px-8 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <heading.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <DialogTitle className="text-xl font-bold text-foreground">{heading.primary}</DialogTitle>
                {heading.secondary && (
                  <p className="text-sm text-muted-foreground">{heading.secondary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {heading.actions}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form id={name} onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col min-h-0 h-[650px] max-h-[85vh]">
            <div className="flex shrink-0 min-h-0 overflow-hidden h-full">
              {/* Sidebar Navigation */}
              <div className="w-64 border-r bg-muted/30 flex flex-col shrink-0 relative z-30 max-w-64 overflow-hidden">
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
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group text-left",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={cn("text-sm font-semibold truncate", isActive ? "text-primary-foreground" : "text-foreground")}>{step.label}</div>
                            <div className={cn("text-[11px] opacity-70 truncate", isActive ? "text-primary-foreground/90" : "text-muted-foreground")}>{step.description}</div>
                          </div>
                          {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Form Content Area */}
              <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className={cn("p-8 space-y-8 pb-12")}>
                    {!currentStepData.hideSectionHeader && (
                      <div className={cn("flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-200")}>
                        <div className="bg-primary/10 p-2 rounded-lg text-primary ring-1 ring-primary/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-foreground">{currentStepData.label}</h3>
                            <TooltipWrapper
                              content={
                                <div className="max-w-[300px] p-1">
                                  <p className="text-xs">{currentStepData.longDescription}</p>
                                </div>
                              }
                            >
                              <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                            </TooltipWrapper>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Form Area */}
                    <div className="animate-in fade-in duration-300">
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
                {(!hideActions && !currentStepData.hideActions) && (
                  <div className="p-4 border-t flex justify-end items-center z-20 gap-3 shrink-0">
                    {(currentStepData.allowSubmit || (steps.length === 2 && currentStepIndex === 0)) && currentStepIndex < steps.length - 1 && (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          SubmitIcon && <SubmitIcon className="h-4 w-4 mr-2" />
                        )}
                        {submitLabel}
                      </Button>
                    )}

                    {currentStepIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(steps[currentStepIndex - 1].id)}
                      >
                        Back
                      </Button>
                    )}

                    {currentStepIndex < steps.length - 1 ? (
                      <Button
                        type={currentStepData.submitOnNext ? "submit" : "button"}
                        variant="secondary"
                        onClick={currentStepData.submitOnNext ? undefined : handleNext}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          SubmitIcon && <SubmitIcon className="h-4 w-4 mr-2" />
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

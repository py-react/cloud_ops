import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Info, LucideProps, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";

type TSteps = {
  id: string;
  label: string;
  icon?: any;
  description: string;
  longDescription: string;
  props: any;
  component: React.ComponentType<any>;
};

type THeading = {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  actions?: React.ReactNode;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
}

export interface IWizard {
  isWizardOpen: boolean;
  setIsWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  steps: TSteps[];
  heading: THeading;
  currentStep: string;
  setCurrentStep: React.Dispatch<React.SetStateAction<string>>;
  variant?: 'dialog' | 'sheet';
}

export const Wizard = ({
  currentStep,
  setCurrentStep,
  isWizardOpen,
  steps,
  setIsWizardOpen,
  heading,
  variant = 'dialog'
}: IWizard) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;
  const CurrentStepComponentProps = currentStepData.props;
  const Icon = currentStepData.icon || Info;

  const Sidebar = () => (
    <div className="w-64 border-r border-border/30 bg-muted/20 flex flex-col h-full relative z-30 max-w-64 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {steps.map((step) => {
            const StepIcon = step.icon || Info;
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "w-56 shrink-0 flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-left",
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
                  <div className="text-[11px] opacity-70 truncate leading-none font-medium text-muted-foreground">
                    {step.description || "General info"}
                  </div>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const MainContent = () => (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-12">
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

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CurrentStepComponent {...CurrentStepComponentProps} />
        </div>
      </div>
    </div>
  );

  if (variant === 'sheet') {
    return (
      <Sheet
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open);
          if (!open) setCurrentStep(steps[0].id);
        }}
      >
        <SheetContent side="right" className="sm:max-w-6xl p-0 overflow-hidden border-l border-border/50">
          <SheetHeader className="py-6 px-8 border-b border-border/30 bg-muted/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <heading.icon className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight">{heading.primary}</SheetTitle>
                  <SheetDescription className="text-xs font-medium text-muted-foreground">{heading.secondary}</SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-8">
                {heading.actions}
              </div>
            </div>
          </SheetHeader>
          <div className="flex h-[calc(100vh-88px)] min-h-0 overflow-hidden">
            <Sidebar />
            <MainContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog
      open={isWizardOpen}
      onOpenChange={(open) => {
        setIsWizardOpen(open);
        if (!open) setCurrentStep(steps[0].id);
      }}
    >
      <DialogContent className="sm:max-w-6xl p-0 overflow-hidden border border-border/30 bg-background shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500 max-h-[90vh]">
        <DialogHeader className="py-6 px-8 border-b border-border/30 bg-muted/30 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <heading.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-0.5">
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

        <div className="flex h-[620px] min-h-0 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default Wizard;
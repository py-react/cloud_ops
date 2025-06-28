import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, LucideProps, XIcon } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type TSteps = {
    id: string;
    label: string;
    description: string;
    longDescription: string;
    props: Record<string,any>
    component: React.FC<Record<string,any>>;
  };

type THeading = {
    primary: React.ReactNode;
    secondary?:React.ReactNode;
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
  }

export const Wizard =({
  currentStep,
  setCurrentStep,
  isWizardOpen,
  steps,
  setIsWizardOpen,
  heading,
}: IWizard) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;
  const CurrentStepComponentProps = currentStepData.props;

  return (
    <Dialog
      open={isWizardOpen}
      onOpenChange={(open) => {
        setIsWizardOpen(open);
        if (!open) setCurrentStep(steps[0].id);
      }}
    >
      <DialogContent className=" max-w-none w-screen h-screen p-0 [&>button]:hidden">
        <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center justify-between">
          <div className="flex flex-col gap-2 px-6">
            <DialogTitle className="flex items-center gap-2 w-full">
              <heading.icon className="h-5 w-5" />
              {heading.primary}
            </DialogTitle>
            {heading.secondary && (
              <p className="text-sm text-gray-500">{heading.secondary}</p>
            )}
          </div>
          <div className="flex justify-end items-center px-6">
            {heading.actions}
            <DialogClose className="flex gap-2 items-center p-2 max-w-max hover:bg-gray-50 rounded-full">
                <XIcon className="w-4 h-4" />
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-1 h-full px-6">
          <div className="flex flex-col h-[calc(100vh-8rem)] px-6">
            {/* Top Bar with Tabs */}
            <div className="flex flex-row pb-2 items-center justify-between mb-6">
              <div className="flex items-center w-full">
                <Tabs
                  tabs={steps.map(({ id, label }) => ({ id, label }))}
                  activeTab={currentStep}
                  onChange={setCurrentStep}
                />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
              {/* Step Information Card */}
              <Card className="shadow-none col-span-1">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <CardTitle>{currentStepData.label}</CardTitle>
                  </div>
                  <CardDescription>
                    {currentStepData.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {currentStepData.longDescription}
                  </p>
                </CardContent>
              </Card>
              {/* Main Form Area (scrollable) */}
              <ScrollArea className="col-span-2 min-h-0 pl-6">
                {/* Step Content */}
                <Card className="shadow-none p-12 col-span-1">
                  <CurrentStepComponent {...CurrentStepComponentProps} />
                </Card>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default Wizard
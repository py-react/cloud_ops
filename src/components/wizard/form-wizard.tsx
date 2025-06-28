import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Loader2, LucideProps, XIcon } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { Button } from "../ui/button";

type TSteps = {
  id: string;
  label: string;
  description: string;
  longDescription: string;
  props: Record<string, any>;
  component: React.FC<Record<string, any>>;
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
  setIsWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  steps: TSteps[];
  heading: THeading;
  currentStep: string;
  setCurrentStep: React.Dispatch<React.SetStateAction<string>>;
  initialValues: T;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  name: string;
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
}: IFormWizard<T>) => {
    const [isSubmitting,setIsSubmitting] = useState(false)
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: initialValues as any,
  });

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;
  const CurrentStepComponentProps = currentStepData.props;

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true)
    await onSubmit(data);
    setIsSubmitting(false)
  };

  return (
    <Dialog
      open={isWizardOpen}
      onOpenChange={(open) => {
        setIsWizardOpen(open);
        if (!open) setCurrentStep(steps[0].id);
      }}
    >
      <Form {...form}>
        <form id={name} onSubmit={form.handleSubmit(handleSubmit)}>
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
              <div className="flex flex-col h-[calc(100vh-12rem)] px-6">
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
            <DialogFooter className="px-12 mb-5">
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
                        type="button"
                        onClick={() => setCurrentStep(steps[currentStepIndex + 1].id)}
                    >
                        Next
                    </Button>
                ) : (
                    <Button form={name} type="submit" disabled={isSubmitting}>
                        {isSubmitting?<Loader2 className="w-2 h-2 animate-spin" />:<></>} Submit
                    </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};
export default FormWizard;

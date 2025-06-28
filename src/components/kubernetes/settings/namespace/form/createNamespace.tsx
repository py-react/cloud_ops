import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Folder,
  Plus,
  Settings,
  Info
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Tabs,
} from "@/components/ui/tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-v2";
import { toast } from "sonner";
import { DefaultService } from "@/gingerJs_api_client";
import { NamespaceContext } from "../../../contextProvider/NamespaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form validation schema
const createNameSchema = z.object({
  name: z.string().min(1, "Context name is required"),
});

type CreateNamespaceFormValues = z.infer<typeof createNameSchema>;

const steps = [
  {
    id: 'basics',
    label: 'Basic Info',
    description: 'Provide basic information for the new namespace.',
    longDescription: 'Enter a unique name for your Kubernetes namespace. This name will be used to identify the namespace within your cluster. Namespace names must be DNS-compliant.',
  }
];

export const CreateNamespace = () => {
    const {
        fetchNamespaces
      } = useContext(NamespaceContext);  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(steps[0].id);

  const form = useForm<CreateNamespaceFormValues>({
    resolver: zodResolver(createNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = form.getValues();
    const transformedData = {
      "name": data.name,
    }
    await DefaultService.apiKubernertesClusterNamespacePost({
        requestBody: transformedData,
      }).then(()=>{
        toast.success(`Successfully created namespace "${data.name}"`);
        fetchNamespaces()
        setIsDialogOpen(false);
      }).catch(err=>{
        toast.error(err as string);
    });
  };

  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  const formHasErrors = () => {
    let hasErrors = false;

    if (currentStep === "basics" && !form.getValues("name")) {
      hasErrors = true;
    }
    return hasErrors;
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setCurrentStep(steps[0].id);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus size={18} />
          Create Namespace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-none w-screen h-screen p-0">
        <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
          <DialogTitle className="flex items-center gap-2 w-full px-6">
            <Settings className="h-5 w-5 " />
            Create Kubernetes Namespace
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full px-6">
          <div className="flex flex-col h-[calc(100vh-8rem)] px-6">
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
              <div className="col-span-1">
                <Card className="pt-6 shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <CardTitle>{steps[0].label}</CardTitle>
                    </div>
                    <CardDescription>
                      {steps[0].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {steps[0].longDescription}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <ScrollArea className="col-span-2 min-h-0 px-4">
                <div className="p-6">
                  <Form {...form}>
                    <form
                      id="create-namespace-form"
                      className="space-y-6"
                      onSubmit={onSubmit}
                    >
                      <div className="space-y-6">
                        <div className="mt-6">
                          {currentStep === "basics" && (
                            <div className="grid grid-cols-1 gap-6">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Namespace Name <RequiredBadge />
                                    </FormLabel>
                                    <FormDescription>
                                      A unique name to identify this Kubernetes namespace in current context
                                    </FormDescription>
                                    <FormControl>
                                      <Input placeholder="dev-team" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </div>
            <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
              <div className="flex items-center gap-4 w-full justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="create-namespace-form" disabled={formHasErrors()}>
                  Create Namespace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNamespace;

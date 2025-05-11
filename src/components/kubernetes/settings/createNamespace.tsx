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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-v2";
import { toast } from "sonner";
import { DefaultService } from "@/gingerJs_api_client";
import { NamespaceContext } from "../context/NamespaceContext";

// Form validation schema
const createNameSchema = z.object({
  name: z.string().min(1, "Context name is required"),
});

type CreateNamespaceFormValues = z.infer<typeof createNameSchema>;

export const CreateNamespace = () => {
    const {
        fetchNamespaces
      } = useContext(NamespaceContext);  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("basics");

  const form = useForm<CreateNamespaceFormValues>({
    resolver: zodResolver(createNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateNamespaceFormValues) => {
    // In a real app, this would call an API to create the context
    console.log("Creating namspce with data:", data);

    // Create the context object from form data
    const newContext = {
      name: data.name,
    };

    const transformedData = {
        "name": data.name,
      }

    
    await DefaultService.apiKubernertesClusterNamespacePost({
        requestBody: transformedData,
      }).then(()=>{
          setIsDialogOpen(false);
          toast.success(`Successfully created namespace "${data.name}"`);
          fetchNamespaces()
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
        if (!open) setCurrentStep("basics");
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus size={18} />
          Create Namespace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
    <DialogHeader>
        <DialogTitle className="text-xl">
        Create Kubernetes Namspace in current context
        </DialogTitle>
        <DialogDescription>
        Create namespace in Kubernetes cluster in current context by providing the necessary
        details.
        </DialogDescription>
    </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 min-h-[500px]">
            <Tabs
              value={currentStep}
              onValueChange={setCurrentStep}
              className="w-full h-full max-h-[420px]"
            >
              <div className="flex items-center justify-between">
                <TabsList className="grid grid-cols-4 w-[450px]">
                  <TabsTrigger
                    value="basics"
                    className="flex items-center gap-1"
                  >
                    <Folder className="h-4 w-4" />
                    Basic Info
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Basic Info Step */}
              <TabsContent value="basics" className="mt-6 space-y-4">
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
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formHasErrors()}>
                Create Namespace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNamespace;

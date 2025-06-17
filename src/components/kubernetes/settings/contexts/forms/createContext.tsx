import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { Info } from "lucide-react";

import {
  Plus,
  Settings,
} from "lucide-react";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KubeContext } from "@/components/kubernetes/contextProvider/KubeContext";
import { DefaultService } from "@/gingerJs_api_client";
import { BasicInfoTab } from "@/components/kubernetes/settings/contexts/forms/sections/BasicInfo";
import { ClusterTab } from "@/components/kubernetes/settings/contexts/forms/sections/ClusterInfo";
import { AuthTab } from "@/components/kubernetes/settings/contexts/forms/sections/AuthInfo";
import { OptionsTab } from "@/components/kubernetes/settings/contexts/forms/sections/Options";
import { Form } from "@/components/ui/form";

// Form validation schema
const createContextSchema = z.object({
  name: z.string().min(1, "Context name is required"),
  namespace: z.string().default("default"),
  server: z.string().min(1, "Server URL is required"),
  certificate_authority_data: z.string().optional(),
  insecure_skip_tls_verify: z.boolean().default(false),
  token: z.string().optional(),
  client_certificate_data: z.string().optional(),
  client_key_data: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  set_current: z.boolean().default(false),
  config_file: z.string().default("~/.kube/config"),
});

type CreateContextFormValues = z.infer<typeof createContextSchema>;

const steps = [
  {
    id: 'basics',
    label: 'Basic Info',
    description: 'Configure basic context information.',
    longDescription: 'Set the name and namespace for your Kubernetes context. The name should be unique and descriptive, while the namespace will be used as the default for all operations with this context.',
    component: BasicInfoTab
  },
  {
    id: 'cluster',
    label: 'Cluster',
    description: 'Configure cluster connection details.',
    longDescription: 'Specify the Kubernetes API server URL and TLS settings. You can provide a certificate authority for secure connections or skip TLS verification for development environments.',
    component: ClusterTab
  },
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Configure authentication settings.',
    longDescription: 'Set up authentication for your Kubernetes cluster. You can use a bearer token, username/password, or client certificates for authentication.',
    component: AuthTab
  },
  {
    id: 'options',
    label: 'Options',
    description: 'Configure additional context options.',
    longDescription: 'Set additional options for your Kubernetes context, such as making it the current context and specifying the config file location.',
    component: OptionsTab
  }
];

const CreateContext = () => {
  const { fetchconfig } = useContext(KubeContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(steps[0].id);

  const form = useForm<CreateContextFormValues>({
    resolver: zodResolver(createContextSchema),
    defaultValues: {
      name: "",
      namespace: "default",
      server: "",
      insecure_skip_tls_verify: false,
      token: "",
      set_current: false,
      config_file: "~/.kube/config",
    },
  });

  const onSubmit = async (data: CreateContextFormValues) => {
    const transformedData = {
      "name": data.name,
      "cluster": {
        "server": data.server,
        "certificate_authority_data": data.certificate_authority_data,
        "insecure_skip_tls_verify": data.insecure_skip_tls_verify
      },
      "user": {
        "token": data.token,
        "client_certificate_data": data.client_certificate_data,
        "client_key_data": data.client_key_data,
        "username": data.username || null,
        "password": data.password || null
      },
      "namesapce": data.namespace,
      "set_current": data.set_current,
      "config_file": data.config_file
    }

    try {
      await DefaultService.apiKubernertesContextPost({
        requestBody: {
          type: "create",
          payload: {
            create: transformedData,
          },
        },
      });
      setIsDialogOpen(false);
      toast.success(`Successfully created context "${data.name}"`);
      fetchconfig();
    } catch (error) {
      toast.error("Failed to create context");
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  // Helper to pass only the correct props to each section
  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
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
          Create Context
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-none w-screen h-screen p-0">
        <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
          <DialogTitle className="flex items-center gap-2 w-full px-6">
            <Settings className="h-5 w-5" />
            Create Kubernetes Context
          </DialogTitle>
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
              <div className="col-span-1">
                <Card className="pt-6 shadow-none">
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
              </div>
              {/* Main Form Area (scrollable) */}
              <ScrollArea className="col-span-2 min-h-0 px-4">
                <div className="p-6">
                  <Form {...form}>
                    <form
                      id="create-context-form"
                      className="space-y-6"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <div className="space-y-6">
                        {/* Step Content */}
                        <div className="mt-6">
                          <CurrentStepComponent {...sectionProps} />
                        </div>
                      </div>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </div>
            {/* Navigation Footer */}
            <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
              <div className="flex items-center gap-4 w-full justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="create-context-form">
                  Create Context
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContext;

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { Info } from "lucide-react";

import {
  Server,
  Users,
  Folder,
  Plus,
  StepForward,
  FileCheck,
  Eye,
  Settings,
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-v2";
import { toast } from "sonner";
import { KubeContext } from "@/components/kubernetes/context/KubeContext";
import { DefaultService } from "@/gingerJs_api_client";

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

// Tab Components
const BasicInfoTab = ({ control, errors }: { control: any; errors: any }) => (
  <div className="grid grid-cols-2 gap-6">
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Context Name <RequiredBadge />
          </FormLabel>
          <FormDescription>
            A unique name to identify this Kubernetes context
          </FormDescription>
          <FormControl>
            <Input placeholder="production-cluster" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="namespace"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Namespace <OptionalBadge />
          </FormLabel>
          <FormDescription>
            Default namespace to use with this context
          </FormDescription>
          <FormControl>
            <Input placeholder="default" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const ClusterTab = ({ control, errors }: { control: any; errors: any }) => (
  <div className="space-y-4">
    <FormField
      control={control}
      name="server"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Server URL <RequiredBadge />
          </FormLabel>
          <FormDescription>
            The URL of the Kubernetes API server (e.g., https://kubernetes.example.com)
          </FormDescription>
          <FormControl>
            <Input placeholder="https://kubernetes.example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="certificate_authority_data"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Certificate Authority Data <OptionalBadge />
          </FormLabel>
          <FormDescription>
            Base64 encoded certificate data for server verification
          </FormDescription>
          <FormControl>
            <Input placeholder="Base64 encoded certificate data" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="insecure_skip_tls_verify"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="m-0">Skip TLS verification</FormLabel>
            <FormDescription>
              Warning: Only use in development environments
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  </div>
);

const AuthTab = ({ control, errors }: { control: any; errors: any }) => (
  <>
    <div className="grid grid-cols-2 gap-6">
      <FormField
        control={control}
        name="token"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Bearer Token <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Authentication token for the Kubernetes API
            </FormDescription>
            <FormControl>
              <Input type="password" placeholder="Token" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Username <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Basic auth username (if token is not used)
            </FormDescription>
            <FormControl>
              <Input placeholder="admin" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="grid grid-cols-2 gap-6 mt-4">
      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Password <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Basic auth password (if token is not used)
            </FormDescription>
            <FormControl>
              <Input type="password" placeholder="Password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="client_certificate_data"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Client Certificate Data <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Base64 encoded client certificate for authentication
            </FormDescription>
            <FormControl>
              <Input placeholder="Base64 encoded certificate" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={control}
      name="client_key_data"
      render={({ field }) => (
        <FormItem className="mt-4">
          <FormLabel>
            Client Key Data <OptionalBadge />
          </FormLabel>
          <FormDescription>
            Base64 encoded client key for certificate authentication
          </FormDescription>
          <FormControl>
            <Input placeholder="Base64 encoded key data" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);

const OptionsTab = ({ control, errors }: { control: any; errors: any }) => (
  <div className="grid grid-cols-2 gap-6">
    <FormField
      control={control}
      name="set_current"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-2 space-y-0">
          <FormControl>
            <input
              type="checkbox"
              className="w-4 h-4 mt-1"
              checked={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="m-0">Set as current context</FormLabel>
            <FormDescription>
              Make this the active context for all operations
            </FormDescription>
          </div>
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="config_file"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Config File Path <OptionalBadge />
          </FormLabel>
          <FormDescription>
            Location to save the Kubernetes config file
          </FormDescription>
          <FormControl>
            <Input placeholder="~/.kube/config" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

// Helper to indicate required fields
const RequiredBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
    Required
  </span>
);

// Helper to indicate optional fields
const OptionalBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
    Optional
  </span>
);

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

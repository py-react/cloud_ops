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
  Server,
  Users,
  Folder,
  Plus,
  StepForward,
  FileCheck,
  Eye,
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

const CreateContext = () => {
    const {
        fetchconfig
      } = useContext(KubeContext);  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("basics");

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
    // In a real app, this would call an API to create the context
    console.log("Creating context with data:", data);

    // Create the context object from form data
    const newContext = {
      name: data.name,
      clusterName: data.name,
      clusterServer: data.server,
      userName: data.username,
      namespace: data.namespace,
      current: data.set_current,
    };

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

    
    const response = await DefaultService.apiKubernertesContextPost({
      requestBody: {
        type: "create",
        payload: {
          create: transformedData,
        },
      },
    }).catch(err=>{
        toast.error(err);
    });
    console.log({response})
    setIsDialogOpen(false);
    toast.success(`Successfully created context "${data.name}"`);
    fetchconfig()
  };

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

  const formHasErrors = () => {
    let hasErrors = false;

    if (currentStep === "basics" && !form.getValues("name")) {
      hasErrors = true;
    }

    if (currentStep === "cluster" && !form.getValues("server")) {
      hasErrors = true;
    }

    if (currentStep === "auth" && !form.getValues("token")) {
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
          Create Context
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
    <DialogHeader>
        <DialogTitle className="text-xl">
        Create Kubernetes Context
        </DialogTitle>
        <DialogDescription>
        Configure access to a Kubernetes cluster by providing the necessary
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
                  <TabsTrigger
                    value="cluster"
                    className="flex items-center gap-1"
                  >
                    <Server className="h-4 w-4" />
                    Cluster
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Auth
                  </TabsTrigger>
                  <TabsTrigger
                    value="options"
                    className="flex items-center gap-1"
                  >
                    <FileCheck className="h-4 w-4" />
                    Options
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
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
              </TabsContent>

              {/* Cluster Configuration Step */}
              <TabsContent value="cluster" className="mt-6 space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="server"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Server URL <RequiredBadge />
                        </FormLabel>
                        <FormDescription>
                          The URL of the Kubernetes API server (e.g.,
                          https://kubernetes.example.com)
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="https://kubernetes.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certificate_authority_data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Certificate Authority Data <OptionalBadge />
                        </FormLabel>
                        <FormDescription>
                          Base64 encoded certificate data for server
                          verification
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="Base64 encoded certificate data"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                          <FormLabel className="m-0">
                            Skip TLS verification
                          </FormLabel>
                          <FormDescription>
                            Warning: Only use in development environments
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Authentication Step */}
              <TabsContent value="auth" className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                          <Input
                            type="password"
                            placeholder="Token"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                          <Input
                            type="password"
                            placeholder="Password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                          <Input
                            placeholder="Base64 encoded certificate"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="client_key_data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client Key Data <OptionalBadge />
                      </FormLabel>
                      <FormDescription>
                        Base64 encoded client key for certificate authentication
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Base64 encoded key data"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Options Step */}
              <TabsContent value="options" className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                          <FormLabel className="m-0">
                            Set as current context
                          </FormLabel>
                          <FormDescription>
                            Make this the active context for all operations
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                Create Context
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContext;

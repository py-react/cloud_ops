import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings,
  Layers,
  Server,
  Shield,
  Cog
} from "lucide-react";

import * as z from "zod";
import { toast } from "sonner";
import { KubeContext } from "@/components/kubernetes/contextProvider/KubeContext";
import { DefaultService } from "@/gingerJs_api_client";
import { BasicInfoTab } from "@/components/kubernetes/settings/contexts/forms/sections/BasicInfo";
import { ClusterTab } from "@/components/kubernetes/settings/contexts/forms/sections/ClusterInfo";
import { AuthTab } from "@/components/kubernetes/settings/contexts/forms/sections/AuthInfo";
import { OptionsTab } from "@/components/kubernetes/settings/contexts/forms/sections/Options";
import FormWizard from "@/components/wizard/form-wizard";

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(steps[0].id);

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
      setIsWizardOpen(false);
      toast.success(`Successfully created context "${data.name}"`);
      fetchconfig();
    } catch (error) {
      toast.error("Failed to create context");
    }
  };

  return (
    <>
      <Button onClick={() => setIsWizardOpen(true)} className="gap-1">
        <Plus size={18} />
        Create Context
      </Button>

      <FormWizard
        name="create-context"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={steps}
        schema={createContextSchema as z.ZodSchema<any>}
        initialValues={{
          name: "",
          namespace: "default",
          server: "",
          insecure_skip_tls_verify: false,
          token: "",
          set_current: false,
          config_file: "~/.kube/config",
        }}
        onSubmit={onSubmit}
        submitLabel="Create Context"
        submitIcon={Plus}
        heading={{
          primary: "Create Kubernetes Context",
          secondary: "Define cluster, user, and namespace connections",
          icon: Layers,
        }}
      />
    </>
  );
};

export default CreateContext;

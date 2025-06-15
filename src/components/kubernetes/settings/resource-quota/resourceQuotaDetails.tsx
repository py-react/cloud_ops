import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { Info, Settings } from "lucide-react";
import {
  Form,
} from "@/components/ui/form";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-v2";
import { toast } from "sonner";
import { formToYaml, yamlToForm } from "./utils/quotaYamlUtil";
import { quotaSchema, QuotaFormValues, NamespaceSettingsModalProps } from './types/quota';
import { extractQuotaFormValues } from './utils/quotaDataUtil';
import yaml from 'js-yaml';

// Import tab components
import ComputeResourcesTab from './quota-tabs/computeResource';
import StorageResourcesTab from './quota-tabs/storageResource';
import ObjectCountsTab from './quota-tabs/objectResource';
import ScopesTab from './quota-tabs/scope';
import PriorityClassTab from './quota-tabs/priorityClass';
import AdvancedTab from './quota-tabs/advance';

const steps = [
  {
    id: 'compute',
    label: 'Compute Resources',
    description: 'Configure CPU and memory resource limits.',
    longDescription: 'Set resource quotas for CPU and memory usage in your namespace. You can specify both requests (guaranteed resources) and limits (maximum resources) for CPU and memory. These settings help ensure fair resource distribution and prevent resource exhaustion.',
    component: ComputeResourcesTab
  },
  {
    id: 'storage',
    label: 'Storage Resources',
    description: 'Configure storage resource limits.',
    longDescription: 'Define storage quotas for your namespace, including persistent volume claims and storage class limits. These settings help manage storage capacity and prevent storage-related issues.',
    component: StorageResourcesTab
  },
  {
    id: 'objects',
    label: 'Object Counts',
    description: 'Set limits on the number of Kubernetes objects.',
    longDescription: 'Control the number of various Kubernetes objects that can be created in your namespace, such as pods, services, and secrets. This helps prevent resource exhaustion and maintains cluster health.',
    component: ObjectCountsTab
  },
  {
    id: 'scopes',
    label: 'Quota Scopes',
    description: 'Configure quota scopes and selectors.',
    longDescription: 'Define which resources are counted towards quota limits using scopes and selectors. This allows for fine-grained control over which resources are subject to quota restrictions.',
    component: ScopesTab
  },
  {
    id: 'priority',
    label: 'Priority Classes',
    description: 'Configure priority class quotas.',
    longDescription: 'Set quotas for different priority classes in your namespace. This helps manage resource allocation based on workload priorities and ensures critical workloads get the resources they need.',
    component: PriorityClassTab
  },
  {
    id: 'advanced',
    label: 'Advanced Settings',
    description: 'Configure advanced quota settings and YAML.',
    longDescription: 'Access advanced configuration options and raw YAML editing. This section is for experienced users who need fine-grained control over quota settings.',
    component: AdvancedTab
  }
];

const ResourceQuotaDetails: React.FC<NamespaceSettingsModalProps> = ({
  quotaName,
  quota,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const [yamlTemplate, setYamlTemplate] = useState("");
  const [isYamlEditorFocused, setIsYamlEditorFocused] = useState(false);

  // Use the utility function to extract form values from quotas
  const form = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues: extractQuotaFormValues(quota),
  });

  const computeQuotaEnabled = form.watch("computeQuota");
  const storageQuotaEnabled = form.watch("storageQuota");
  const objectQuotaEnabled = form.watch("objectQuota");
  const scopesEnabled = form.watch("enableScopes");
  const priorityClassQuotaEnabled = form.watch("priorityClassQuota");
  const volumeAttributesClassQuotaEnabled = form.watch(
    "volumeAttributesClassQuota"
  );
  const rawYamlEnabled = form.watch("enableRawYaml");

  // Initialize YAML from form values when component mounts
  useEffect(() => {
    const initialYaml = formToYaml(form.getValues(), quota.namespace);
    setYamlTemplate(initialYaml);
    form.setValue("rawYaml", initialYaml);
  }, []);

  // Update YAML when form values change
  useEffect(() => {
    if (!isYamlEditorFocused && activeTab !== "advanced") {
      const yaml = formToYaml(form.getValues(), quota.namespace);
      setYamlTemplate(yaml);
      form.setValue("rawYaml", yaml);
    }
  }, [
    form.watch("quotaName"),
    computeQuotaEnabled,
    storageQuotaEnabled,
    objectQuotaEnabled,
    scopesEnabled,
    priorityClassQuotaEnabled,
    volumeAttributesClassQuotaEnabled,
    form.watch("limitsCpu"),
    form.watch("limitsMemory"),
    form.watch("requestsCpu"),
    form.watch("requestsMemory"),
    form.watch("hugepages"),
    form.watch("requestsStorage"),
    form.watch("persistentvolumeclaims"),
    form.watch("pods"),
    form.watch("configmaps"),
    form.watch("secrets"),
    form.watch("services"),
    form.watch("servicesLoadBalancers"),
    form.watch("servicesNodePorts"),
    form.watch("replicationcontrollers"),
    form.watch("resourcequotas"),
    form.watch("scopeSelector"),
  ]);

  // Handle YAML content changes
  const handleYamlChange = (value: string | undefined) => {
    const newYaml = value || "";
    form.setValue("rawYaml", newYaml);
    // If raw YAML is enabled and user is editing, update the form fields
    // This creates a bidirectional binding between YAML and form
    if (rawYamlEnabled) {
      try {
        const formValues = yamlToForm(newYaml);
        // prevent user to edit these if editing and not creating
        if(quota.name){
            formValues.quotaName = quota.name 
        }
        if(quota.namespace){
            formValues.quotaNamespace = quota.namespace
        }
        // Update each form field that exists in the parsed YAML
        Object.entries(formValues).forEach(([key, value]) => {
          if (key === "scopeSelector" && value) {
            // Handle nested objects
            const scopeSelector = value as any;
            Object.entries(scopeSelector).forEach(([scopeKey, scopeValue]) => {
              form.setValue(`scopeSelector.${scopeKey}` as any, scopeValue);
            });
          } else {
            // Handle normal fields
            form.setValue(key as any, value);
          }
        });
      } catch (error) {
        console.error("Error updating form from YAML:", error);
      }
    }
    setYamlTemplate(newYaml);
  };

  const onSubmit = (data: QuotaFormValues) => {
    // If raw YAML is enabled, use that instead of form data
    if (rawYamlEnabled) {
      try {
        // Try to parse the YAML to ensure it's valid
        const yamlDocs = data.rawYaml
          ?.split("---")
          .filter((doc) => doc.trim() !== "")
          .map((doc) => yaml.load(doc));

        onUpdate({
          ...data,
          rawYaml: data.rawYaml,
          parsedYaml: yamlDocs,
        });
        toast.success("Resource quotas updated successfully");
        onClose();

      } catch (error) {
        console.error("Invalid YAML:", error);
        toast.error("Invalid YAML. Please check your syntax.");
      }
    } else {
      onUpdate(data);
      toast.success("Resource quotas updated successfully");
      onClose();
    }
  };

  const handleDelete = () => {
    // In a real app, this would make an API call to delete the namespace
    const rawYaml = form.watch("rawYaml")
    onDelete(rawYaml)
  };

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  // Helper to pass only the correct props to each section
  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    namespace: quotaName,
    quotaName: quotaName,
    onYamlChange: handleYamlChange,
    yamlTemplate: yamlTemplate,
    setIsYamlEditorFocused: setIsYamlEditorFocused,
    handleDelete: handleDelete
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0">
        {/* Dialog Header */}
        <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
          <DialogTitle className="flex items-center gap-2 w-full px-6">
            <Settings className="h-5 w-5 " />
            Configure Resource Quota
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full px-6">
          <div className="flex flex-col h-[calc(100vh-8rem)] px-6">
            {/* Top Bar with Tabs */}
            <div className="flex flex-row pb-2 items-center justify-between mb-6">
              <div className="flex items-center w-full">
                <Tabs
                  tabs={steps.map(({ id, label }) => ({ id, label }))}
                  activeTab={activeTab}
                  onChange={setActiveTab}
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
                      id="resource-quota-form"
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
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" form="resource-quota-form">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceQuotaDetails;
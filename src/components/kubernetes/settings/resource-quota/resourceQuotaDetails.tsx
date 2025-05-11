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
import {
  Form,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-v2";
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

const ResourceQuotaDetails: React.FC<NamespaceSettingsModalProps> = ({
  quotaName,
  quota,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState("compute");

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

  return (
    <>
      <Dialog open={true} onOpenChange={() =>onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Namespace: {quotaName}</DialogTitle>
            <DialogDescription>
              Manage resource quotas, scopes, and other settings for this
              namespace
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-6 mb-4">
                  <TabsTrigger value="compute">Compute</TabsTrigger>
                  <TabsTrigger value="storage">Storage</TabsTrigger>
                  <TabsTrigger value="objects">Objects</TabsTrigger>
                  <TabsTrigger value="scopes">Scopes</TabsTrigger>
                  <TabsTrigger value="priority">Priority</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <div className="h-[500px] overflow-y-auto">
                    {/* Compute Resources Tab */}
                    <TabsContent value="compute">
                    <ComputeResourcesTab />
                    </TabsContent>

                    {/* Storage Resources Tab */}
                    <TabsContent value="storage">
                    <StorageResourcesTab />
                    </TabsContent>

                    {/* Object Count Quotas Tab */}
                    <TabsContent value="objects">
                    <ObjectCountsTab />
                    </TabsContent>

                    {/* Quota Scopes Tab */}
                    <TabsContent value="scopes">
                    <ScopesTab />
                    </TabsContent>

                    {/* Priority Class Tab */}
                    <TabsContent value="priority">
                    <PriorityClassTab namespace={quotaName} />
                    </TabsContent>

                    {/* Advanced Tab with Monaco Editor */}
                    <TabsContent value="advanced">
                    <AdvancedTab
                        onYamlChange={handleYamlChange}
                        yamlTemplate={yamlTemplate}
                        setIsYamlEditorFocused={setIsYamlEditorFocused}
                        quotaName={quotaName}
                        handleDelete={handleDelete}
                    />
                    </TabsContent>
                </div>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResourceQuotaDetails;
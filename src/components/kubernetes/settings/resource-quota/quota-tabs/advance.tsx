import React, { useEffect } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { QuotaFormValues } from '../types/quota';
import DeleteQuotaDialog from "../dialog/deleteQuota";
import Editor from "@monaco-editor/react";

interface AdvancedTabProps {
  onYamlChange: (value: string | undefined) => void;
  yamlTemplate: string;
  setIsYamlEditorFocused: (focused: boolean) => void;
  quotaName: string;
  handleDelete: () => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  onYamlChange,
  yamlTemplate,
  setIsYamlEditorFocused,
  quotaName,
  handleDelete
}) => {
  const form = useFormContext<QuotaFormValues>();
  const rawYamlEnabled = form.watch("enableRawYaml");
  
  // Helper function to render YAML syntax hints
  const renderYamlSyntaxHints = () => {
    if (!rawYamlEnabled) return null;
    
    return (
      <div className="mt-4 space-y-2 text-sm">
        <h4 className="font-semibold">YAML Syntax Hints:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Compute Resources:</p>
            <pre className="text-xs overflow-x-auto">
{`spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "4"
    limits.memory: "8Gi"
    hugepages-2Mi: "100Mi"`}
            </pre>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Storage Resources:</p>
            <pre className="text-xs overflow-x-auto">
{`spec:
  hard:
    requests.storage: "100Gi"
    persistentvolumeclaims: "10"
    gold.storageclass.storage.k8s.io/requests.storage: "10Gi"`}
            </pre>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Object Counts:</p>
            <pre className="text-xs overflow-x-auto">
{`spec:
  hard:
    pods: "10"
    configmaps: "10"
    secrets: "10"
    count/deployments.apps: "5"`}
            </pre>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Scope Selector:</p>
            <pre className="text-xs overflow-x-auto">
{`spec:
  scopeSelector:
    matchExpressions:
    - scopeName: PriorityClass
      operator: In
      values: ["high"]`}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  useEffect(()=>{
    return ()=>{
        form.setValue("enableRawYaml", false);
    }
  },[])
  
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="enableRawYaml"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Advanced YAML Editor</FormLabel>
              <FormDescription>
                Edit resource quota YAML directly for advanced configurations
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      {rawYamlEnabled && (
          <FormField
            control={form.control}
            name="rawYaml"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Quota YAML</FormLabel>
                <FormControl>
                  <div className="h-[400px] border rounded-md overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="yaml"
                      language="yaml"
                      value={field.value}
                      onChange={onYamlChange}
                      onMount={(editor) => {
                        form.setValue("rawYaml", yamlTemplate);
                        // Add event listeners for focus/blur
                        editor.onDidFocusEditorText(() => setIsYamlEditorFocused(true));
                        editor.onDidBlurEditorText(() => setIsYamlEditorFocused(false));
                      }}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        wrappingIndent: "indent",
                        automaticLayout: true
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Edit the YAML directly for advanced resource quota configurations
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
      )}
      
      {renderYamlSyntaxHints()}
      
      <div className="mt-4 border border-red-200 bg-red-50 rounded-md p-4">
        <h3 className="text-red-700 font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Actions here can result in irreversible changes
        </p>
        <DeleteQuotaDialog 
          quotaName={quotaName}
          onCancel={() => {}}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default AdvancedTab;
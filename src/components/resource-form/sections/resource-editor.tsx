import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import Editor from "@monaco-editor/react";
import { SchemaValues } from '../resource-form';

const ResourceEditor: React.FC = ({ resourceType }) => {
  const form = useFormContext<SchemaValues>();
  const { control, formState: { errors } } = form;

  const handleYamlChange = (value: string | undefined) => {
    try {
      form.setValue("rawYaml", value || "");
      // Clear any existing YAML validation errors when user starts typing
      if (errors?.rawYaml?.message && value) {
        form.setError("rawYaml", { message: "" });
      }
    } catch (error) {
      console.error("Error updating YAML value:", error);
    }
  };

  return (
    <div className="">
      <FormField
        control={control}
        name="rawYaml"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={errors?.rawYaml?.message?.length ? "text-destructive" : "text-neutral-600"}>
              {resourceType} YAML
            </FormLabel>
            <FormControl>
              <div
                className={`h-[calc(100vh-29rem)] border rounded-md overflow-hidden ${errors?.rawYaml?.message?.length ? "border-destructive" : ""
                  }`}
              >
                <Editor
                  className="h-[calc(100vh-29rem)]"
                  defaultLanguage="yaml"
                  language="yaml"
                  value={field.value}
                  onChange={handleYamlChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    wrappingIndent: "indent",
                    automaticLayout: true,
                    fontSize: 14,
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    tabSize: 2,
                    theme: "vs-light",
                  }}
                />
              </div>
            </FormControl>
            <FormDescription>
              Edit the YAML configuration for your resource quota. This will
              define all resource limits and constraints for the namespace.
            </FormDescription>
            <FormMessage>
              {errors?.rawYaml?.message}
            </FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
};

export default ResourceEditor;
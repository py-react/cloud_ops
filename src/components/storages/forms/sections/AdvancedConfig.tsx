import React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Editor } from "@monaco-editor/react";

interface AdvancedConfigProps {
  control: Control<any>;
  errors: any;
  watch: UseFormWatch<any>;
}

export function AdvancedConfig({ control, errors, watch }: AdvancedConfigProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="driver_opts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Driver Options
            </FormLabel>
            <FormDescription>
              Driver-specific options in JSON format
            </FormDescription>
            <FormControl>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="150px"
                  defaultLanguage="json"
                  theme="vs-light"
                  value={JSON.stringify(field.value, null, 2)}
                  onChange={(value) => {
                    try {
                      field.onChange(JSON.parse(value || '{}'));
                    } catch (e) {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'off',
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                    glyphMargin: false,
                    contextmenu: false,
                    scrollbar: {
                      vertical: 'hidden',
                      horizontal: 'hidden'
                    }
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="labels"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Labels
            </FormLabel>
            <FormDescription>
              Volume labels in JSON format
            </FormDescription>
            <FormControl>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="150px"
                  defaultLanguage="json"
                  theme="vs-light"
                  value={JSON.stringify(field.value, null, 2)}
                  onChange={(value) => {
                    try {
                      field.onChange(JSON.parse(value || '{}'));
                    } catch (e) {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'off',
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                    glyphMargin: false,
                    contextmenu: false,
                    scrollbar: {
                      vertical: 'hidden',
                      horizontal: 'hidden'
                    }
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 
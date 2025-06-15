import React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Editor } from "@monaco-editor/react";
import { OptionalBadge } from "@/components/network/forms/badges";

export function AdvancedConfig({ control, errors }: { control: any; errors: any }) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="options"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Options <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Network options in JSON format
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
              Labels <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Network labels in JSON format
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
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Editor } from "@monaco-editor/react";
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
import { ChevronDown, ChevronUp } from "lucide-react";

// Form validation schema
const createNetworkSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  driver: z.string().default("bridge"),
  scope: z.string().default("local"),
  options: z.record(z.string()).default({}),
  ipam: z.object({
    driver: z.string().default("default"),
    config: z.array(z.record(z.string())).default([])
  }),
  check_duplicate: z.boolean().default(true),
  internal: z.boolean().default(false),
  labels: z.record(z.string()).default({}),
  enable_ipv6: z.boolean().default(false),
  attachable: z.boolean().default(false),
  ingress: z.boolean().default(false)
});

type CreateNetworkFormValues = z.infer<typeof createNetworkSchema>;

interface CreateNetworkFormProps {
  onSubmit: (data: CreateNetworkFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CreateNetworkForm({ onSubmit, onCancel }: CreateNetworkFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const form = useForm<CreateNetworkFormValues>({
    resolver: zodResolver(createNetworkSchema),
    defaultValues: {
      name: "",
      driver: "bridge",
      scope: "local",
      options: {},
      ipam: {
        driver: "default",
        config: []
      },
      check_duplicate: true,
      internal: false,
      labels: {},
      enable_ipv6: false,
      attachable: false,
      ingress: false
    },
  });

  const handleSubmit = async (data: CreateNetworkFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create network:', error);
      toast.error('Failed to create network');
    }
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

  return (
    <Form {...form}>
      <form id="create-network-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Required Fields */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Network Name <RequiredBadge />
                </FormLabel>
                <FormDescription>
                  A unique name to identify this Docker network
                </FormDescription>
                <FormControl>
                  <Input placeholder="my-network" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Advanced Options Toggle */}
          <FormItem className="flex flex-row items-center gap-2 space-y-0 border-t pt-4">
            <FormControl>
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="m-0">
                Advanced Options
              </FormLabel>
              <FormDescription>
                Configure additional network settings
              </FormDescription>
            </div>
          </FormItem>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              <FormField
                control={form.control}
                name="driver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Driver <OptionalBadge />
                    </FormLabel>
                    <FormDescription>
                      Network driver to use (default: bridge)
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="bridge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Scope <OptionalBadge />
                    </FormLabel>
                    <FormDescription>
                      Network scope (default: local)
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="internal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="m-0">
                          Internal Network
                        </FormLabel>
                        <FormDescription>
                          Restrict external access to the network
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enable_ipv6"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="m-0">
                          Enable IPv6
                        </FormLabel>
                        <FormDescription>
                          Enable IPv6 networking
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="m-0">
                          Attachable
                        </FormLabel>
                        <FormDescription>
                          Allow manual container attachment
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ingress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="m-0">
                          Ingress
                        </FormLabel>
                        <FormDescription>
                          Create an ingress network
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
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
                control={form.control}
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

              <FormField
                control={form.control}
                name="ipam.config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      IPAM Config <OptionalBadge />
                    </FormLabel>
                    <FormDescription>
                      IPAM configuration in JSON format
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
                              field.onChange(JSON.parse(value || '[]'));
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
          )}
        </div>
      </form>
    </Form>
  );
} 
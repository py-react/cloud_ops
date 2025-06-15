import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from 'lucide-react'
import type { CreateStorageParams } from '@/types/storage'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Editor } from "@monaco-editor/react"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  driver: z.string().default("local"),
  driver_opts: z.record(z.string()).default({}),
  labels: z.record(z.string()).default({}),
})

type CreateStorageFormValues = z.infer<typeof formSchema>;

interface CreateStorageFormProps {
  onSubmit: (data: CreateStorageFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CreateStorageForm({ onSubmit, onCancel }: CreateStorageFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const form = useForm<CreateStorageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      driver: "local",
      driver_opts: {},
      labels: {},
    },
  });

  const handleSubmit = async (data: CreateStorageFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create volume:', error);
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
      <form id="create-storage-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Required Fields */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Volume Name <RequiredBadge />
                </FormLabel>
                <FormDescription>
                  A unique name to identify this Docker volume
                </FormDescription>
                <FormControl>
                  <Input placeholder="my-volume" {...field} />
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
                Configure additional volume settings
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
                      Volume driver to use (default: local)
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driver_opts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Driver Options <OptionalBadge />
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
                control={form.control}
                name="labels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Labels <OptionalBadge />
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
          )}
        </div>
      </form>
    </Form>
  )
}


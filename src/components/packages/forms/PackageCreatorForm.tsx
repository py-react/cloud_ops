import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'sonner';
import { Loader2, Info, ContainerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import MonacoEditor from '@monaco-editor/react';

const schema = z.object({
  content: z.string().min(1, 'Dockerfile content is required'),
  tag: z.string().min(1, 'Tag is required'),
});

const defaultValues = {
  content: '# Write your Packagefile here\nFROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
  tag: '',
};

interface PackageCreatorFormProps {
  onSubmitHandler: (data: { content: string; tag: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PackageCreatorForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: PackageCreatorFormProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      if(submitting) return;
      setSubmitting(true);
      await onSubmitHandler(data);
      setSubmitting(false);
    } catch (error) {
      toast.error(`Failed to create package: ${error}`);
    }
  };

  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  return (
    <div className="h-full flex flex-col px-6">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
        {/* Information Card */}
        <div className="col-span-1">
          <Card className="pt-6 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>Create Package</CardTitle>
              </div>
              <CardDescription>Create a new Docker image from a Dockerfile</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create a new Docker image by providing a Dockerfile and tag. Write your Dockerfile content in the editor below.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form Area */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form
                id="create-package-form"
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Dockerfile <RequiredBadge />
                        </FormLabel>
                        <FormDescription>
                          The Dockerfile content for your package
                        </FormDescription>
                        <FormControl>
                          <div style={{ height: '400px', border: '1px solid #ccc' }}>
                            <MonacoEditor
                              height="400px"
                              language="dockerfile"
                              theme="vs-light"
                              value={field.value}
                              onChange={field.onChange}
                              options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                tabSize: 2,
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
                    name="tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tag <RequiredBadge />
                        </FormLabel>
                        <FormDescription>
                          The tag for your package (e.g., nginx:latest)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="e.g., nginx:latest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-4 w-full justify-end">
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={!form.getValues("content") || !form.getValues("tag") || submitting}
            className="ml-4"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ContainerIcon className="h-4 w-4 mr-2" />
            )}
            Create Package
          </Button>
        </div>
      </div>
    </div>
  );
} 
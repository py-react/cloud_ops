import React from 'react';
import { LoaderIcon, ContainerIcon, Cross, XIcon } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const createPackageSchema = z.object({
  content: z.string().min(1, 'Dockerfile content is required'),
  tag: z.string().min(1, 'Tag is required'),
});

type CreatePackageFormValues = z.infer<typeof createPackageSchema>;

interface PackageCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; tag: string }) => Promise<void>;
}

export function PackageCreatorModal({ open, onClose, onSubmit }: PackageCreatorModalProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<CreatePackageFormValues>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      content: '# Write your Packagefile here\nFROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
      tag: '',
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (data: CreatePackageFormValues) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
    }
  };

  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="!w-[50%] sm:!max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ContainerIcon className="h-5 w-5" />
            Create package
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 h-[90%]">
          {/* File input for Dockerfile */}
          <div className="mb-4 flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Dockerfile</label>
            <input
              ref={fileInputRef}
              type="file"
              className="block max-w-fit text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const text = await file.text();
                  form.setValue('content', text, { shouldValidate: true });
                }
              }}
            />
            {!!fileInputRef.current?.files?.length && (
              <Button
                type="button"
                variant="ghost"
                className="ml-2"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  form.setValue('content', '# Write your Packagefile here\nFROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]', { shouldValidate: true });
                }}
              >
                <XIcon className='w-4 h-4' />
              </Button>
            )}
          </div>
          <Form {...form}>
            <form id="create-package-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                          theme="vs-dark"
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
            </form>
          </Form>
        </div>
        <SheetFooter className="p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-package-form" disabled={submitting}>
            {submitting ? <LoaderIcon className="w-4 h-4 mr-2" /> : null}
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
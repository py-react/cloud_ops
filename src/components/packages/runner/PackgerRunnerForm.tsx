import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowDownToLineIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
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

const pullPackageSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  registry: z.string().min(1, 'Registry is required'),
});

type PullPackageFormValues = z.infer<typeof pullPackageSchema>;

export function PackageRunnerForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: {
  onSubmitHandler: (data: { image: string; registry: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const form = useForm<PullPackageFormValues>({
    resolver: zodResolver(pullPackageSchema),
    defaultValues: {
      image: '',
      registry: 'docker.io',
    },
  });

  const handleSubmit = async (data: PullPackageFormValues) => {
    try {
      if (submitting) return;
      setSubmitting(true);
      await onSubmitHandler(data);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      toast.error(`Failed to pull package: ${error}`);
    }
  };

  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  return (
    <Form {...form}>
      <form id="pull-package-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Image <RequiredBadge />
              </FormLabel>
              <FormDescription>
                The name of the image to pull (e.g., nginx:latest)
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., nginx:latest" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Registry <RequiredBadge />
              </FormLabel>
              <FormDescription>
                The registry to pull from (default: docker.io)
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., docker.io" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}


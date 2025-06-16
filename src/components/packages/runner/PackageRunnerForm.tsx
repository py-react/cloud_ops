import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'sonner';
import { Loader2, Info, ArrowDownToLineIcon } from 'lucide-react';
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

const schema = z.object({
  image: z.string().min(1, "Image name is required"),
  registry: z.string().optional(),
});

const defaultValues = {
  image: "",
  registry: "docker.io",
};

interface PackageRunnerFormProps {
  onSubmitHandler: (data: { image: string; registry?: string }) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PackageRunnerForm({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: PackageRunnerFormProps) {
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
      toast.error(`Failed to pull package: ${error}`);
    }
  };

  return (
    <div className="h-full flex flex-col px-6">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
        {/* Information Card */}
        <div className="col-span-1">
          <Card className="pt-6 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>Pull Package</CardTitle>
              </div>
              <CardDescription>Pull a Docker image from a registry</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Enter the name of the Docker image you want to pull. You can specify a registry if the image is not in the default Docker Hub registry.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form Area */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form
                id="pull-package-form"
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Name</FormLabel>
                        <FormDescription>
                          The name of the Docker image to pull (e.g., nginx:latest)
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
                        <FormLabel>Registry (Optional)</FormLabel>
                        <FormDescription>
                          The registry to pull from (e.g., docker.io)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="e.g., docker.io" {...field} />
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
            disabled={!form.getValues("image") || submitting}
            className="ml-4"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowDownToLineIcon className="h-4 w-4 mr-2" />
            )}
            Pull Package
          </Button>
        </div>
      </div>
    </div>
  );
} 
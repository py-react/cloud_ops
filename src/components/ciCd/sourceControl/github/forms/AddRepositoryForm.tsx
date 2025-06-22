import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import BasicConfig from './sections/BasicConfig';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';
import { DialogClose } from '@/components/ui/dialog';

// Placeholder schema and types for now
interface AddRepositoryFormData {
  name: string;
  branches: { value: string }[];
}

interface AddRepositoryFormProps {
  onSuccess: () => void;
  initialValues?: AddRepositoryFormData;
  isEdit?: boolean;
}

const steps = [
  {
    id: 'basic',
    label: 'Repository Details',
    description: 'Enter the repository name and configuration.',
    longDescription: 'Provide the name of the GitHub repository you want to add and configure allowed branches and events.',
    component: BasicConfig,
  },
];

const defaultValues: AddRepositoryFormData = {
  name: '',
  branches: [],
};

const AddRepositoryForm: React.FC<AddRepositoryFormProps> = ({ onSuccess, initialValues, isEdit }) => {
  const [activeTab, setActiveTab] = useState(steps[0].id);
  const form = useForm<AddRepositoryFormData>({
    defaultValues: initialValues || defaultValues,
  });

  const handleSubmit = async (data: AddRepositoryFormData) => {
    const allowed_branches = data.branches.map(b => b.value)
    await DefaultService.apiIntegrationGithubWebhookPut({ requestBody: {
      repo_name: data.name,
      branches: allowed_branches
    } }).then((res: any) => {
      if (res.success) {
        toast.success(res.message)
        onSuccess()
      } else {
        toast.error(res.message)
      }
    }).catch((err: any) => {
      toast.error(err.message)
    })
  };

  const currentStepIndex = steps.findIndex((s) => s.id === activeTab);
  const currentStepData = steps[currentStepIndex];
  const CurrentStepComponent = currentStepData.component;

  const sectionProps = {
    control: form.control,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
  };

  return (
    <div className="h-full flex flex-col px-6">
      {/* Top Bar with Tabs, Step Info, and Create Button */}
      <div className="flex flex-row pb-2 items-center justify-between mb-6">
        <div className="flex items-center w-full">
          <Tabs
            tabs={steps.map(({ id, label }) => ({ id, label }))}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
        {/* Step Information Card */}
        <div className="col-span-1">
          <Card className="pt-6 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>{currentStepData.label}</CardTitle>
              </div>
              <CardDescription>{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {currentStepData.longDescription}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Main Form Area (scrollable) */}
        <ScrollArea className="col-span-2 min-h-0 px-4">
          <div className="p-6">
            <Form {...form}>
              <form id="add-repository-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-6">
                  {/* Step Content */}
                  <div className="mt-6">
                    <CurrentStepComponent {...sectionProps} />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>
      {/* Navigation Footer (always at the bottom) */}
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-4 w-full justify-end">
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? (isEdit ? 'Saving...' : 'Adding...')
              : (isEdit ? 'Save Changes' : 'Add Repository')}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </div>
      </div>
    </div>
  );
};

export default AddRepositoryForm; 
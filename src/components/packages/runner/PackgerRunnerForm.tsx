import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowDownToLineIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';

export const PackageRunnerForm = ({
  onSubmitHandler,
  submitting,
  setSubmitting,
}: {
  onSubmitHandler: (data: {image:string,registry:string}) => Promise<void>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}) => {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      image:"",
      registry:"docker.io"
    },
  });

  const onSubmit = async(data) => {
    try {
        if(submitting)return
        setSubmitting(true);
        await onSubmitHandler(data);
        setSubmitting(false);
        // TODO: Implement actual container run API call
      } catch (error) {
        toast.error(`Failed to run container: ${error}`);
      }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
          <label className="block text-sm font-medium text-gray-700">Package</label>
          <input
            {...register('image', { required: 'Image is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx:latest"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
          )}
        </div>
      <div>
          <label className="block text-sm font-medium text-gray-700">Registry</label>
          <input
            {...register('registry', { required: 'Image is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx:latest"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.registry?.message}</p>
          )}
        </div>
      <div className="flex justify-end pt-4 border-t">
        <button
          disabled={submitting}
          type="submit"
          className={`px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex justify-between items-center ${
                     submitting ? "pointer-events-none" : "pointer-events-auto"
                   }`}
        >
          {submitting ? (
            <LoaderIcon className="w-4 h-4 mr-2" />
          ) : (
            <ArrowDownToLineIcon className="w-4 h-4 mr-2" />
          )}
          Pull
        </button>
      </div>
    </form>
  );
};


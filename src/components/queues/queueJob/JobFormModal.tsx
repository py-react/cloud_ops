import React from 'react';
import { X } from 'lucide-react';
import type { JobFormData } from './type';
import { JobBasicForm } from './JobBasicForm';
import { JobRepeatForm } from './JobRepeatForm';
import { JobDataForm } from './JobDataForm';
import { Button } from "@/components/ui/button"

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
}

export function JobFormModal({ isOpen, onClose, onSubmit }: JobFormModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: JobFormData = {
      queueName: formData.get('queueName') as string,
      meta: {
        id: formData.get('id') as string,
        name: formData.get('name') as string,
        delay: Number(formData.get('delay')) || undefined,
        attempts: Number(formData.get('attempts')) || undefined,
        repeat: formData.get('enableRepeat') === 'true' ? {
            count: Number(formData.get('count')) || undefined,
            every: Number(formData.get('every')) || undefined,
            limit: Number(formData.get('limit')) || undefined,
            cron: formData.get('cron') as string || undefined,
            startDate: formData.get('startDate') as Date || undefined,
            endDate: formData.get('endDate') as Date || undefined,
            tz: formData.get('tz') as string || undefined,
        } : undefined,
      },
      data: JSON.parse(formData.get('jobData') as string || '{}'),
    };

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Job</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <JobBasicForm />
          <JobRepeatForm />
          <JobDataForm />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
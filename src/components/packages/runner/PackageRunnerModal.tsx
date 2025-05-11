import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PackageRunnerForm } from './PackgerRunnerForm';

interface IPackageRunnerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {image:string,registry:string}) => Promise<void>;
}

export function PackageRunnerModal({ open, onClose, onSubmit }: IPackageRunnerModalProps) {
  const [submitting,setSubmitting] = useState(false)

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Pull package</h2>
          <button
            onClick={(e)=>{
              if(!submitting)onClose()
            }}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <PackageRunnerForm onSubmitHandler={onSubmit} submitting={submitting} setSubmitting={setSubmitting} />
        </div>
      </div>
    </div>
  );
}
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {message}
        </div>
      </div>
    </div>
  );
}
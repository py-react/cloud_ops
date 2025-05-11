import React, { useState } from 'react';
import { LoaderIcon, X } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';

interface IPackageCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data:{content:string,tag:string}) => Promise<void>;
}

export function PackageCreatorModal({ open, onClose, onSubmit }: IPackageCreatorModalProps) {
  const [tag,setTag] = useState("")
  const [submitting,setSubmitting] = useState(false)
  const [editorContent, setEditorContent] = useState('# Write your Packagefile here\nFROM node:14\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]')
  if (!open) return null;

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value)
    }
  }

  const handleSave = async() => {
    setSubmitting(true)
    await onSubmit({content: editorContent,tag})
    setSubmitting(false)
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create package
          </h2>
          <button
            onClick={(e) => {
              if (!submitting) onClose();
            }}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div style={{ height: "400px", border: "1px solid #ccc" }}>
            <MonacoEditor
              height="400px"
              language="dockerfile"
              theme="vs-dark"
              value={editorContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                renderLineHighlight: "all",
                tabSize: 2,
              }}
            />
          </div>
          <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">Tag</label>
          <input
            onChange={(e)=>{
                setTag(e.target.value)
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., nginx:latest"
          />
        </div>
          <div className="flex justify-end pt-4 border-t">
            <button
                onClick={handleSave}
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
                null
              )}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
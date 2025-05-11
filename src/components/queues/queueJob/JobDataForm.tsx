import React,{useState} from 'react';
import MonacoEditor from '@monaco-editor/react';


export function JobDataForm() {
  const [editorContent, setEditorContent] = useState('{}')

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Job Data</h3>
      <textarea
        id="jobData"
        name="jobData"
        rows={4}
        value={editorContent}
        className="hidden mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="{}"
      />
      <div className="h-[120px] border border-gray-600 rounded overflow-hidden">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          value={editorContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

    </div>
  );
}
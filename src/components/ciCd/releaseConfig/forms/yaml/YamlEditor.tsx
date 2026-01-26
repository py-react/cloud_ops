import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Copy, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateKubernetesSpec, K8sValidationResult } from './kubernetesSchema';
import { parseYaml, stringifyYaml } from './yamlUtils';

interface YamlEditorProps {
  yaml: string;
  onChange: (yaml: string) => void;
  onImport?: () => void;
}

export default function YamlEditor({ yaml, onChange, onImport }: YamlEditorProps) {
  const [validationResult, setValidationResult] = useState<K8sValidationResult>({ valid: true, errors: [] });

  useEffect(() => {
    const result = validateKubernetesSpec(parseYaml(yaml).data);
    setValidationResult(result);
  }, [yaml]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseYaml(text);
      if (parsed.valid && parsed.data) {
        const formattedYaml = stringifyYaml(parsed.data);
        onChange(formattedYaml);
      }
    } catch (err) {
      console.error('Failed to import from clipboard:', err);
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">YAML Editor</span>
          {validationResult.valid ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              Valid
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" />
              {validationResult.errors.length} Error{validationResult.errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportFromClipboard}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyToClipboard}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {!validationResult.valid && validationResult.errors.length > 0 && (
        <div className="bg-destructive/5 border-b p-3 max-h-32 overflow-auto">
          <div className="text-xs font-medium text-destructive mb-2">Validation Errors:</div>
          <ul className="space-y-1">
            {validationResult.errors.slice(0, 5).map((error, index) => (
              <li key={index} className="text-xs text-destructive/80">
                <span className="font-mono bg-destructive/10 px-1 rounded mr-2">{error.path}</span>
                {error.message}
              </li>
            ))}
            {validationResult.errors.length > 5 && (
              <li className="text-xs text-muted-foreground">
                ...and {validationResult.errors.length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="yaml"
          value={yaml}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 16, bottom: 16 },
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}

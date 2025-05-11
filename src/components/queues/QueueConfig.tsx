import React, { useState, useRef, useEffect } from 'react'
import { DialogContent, DialogHeader, DialogTitle,DialogFooter, } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from 'lucide-react'
import MonacoEditor from '@monaco-editor/react';


interface QueueConfigFormData {
  queueName: string;
  prefix: string;
  processFileName: string;
  queueProps: Record<string, string>;
}

interface QueueConfigModalProps {
  onSubmit: (data: QueueConfigFormData) => void;
  onClose: () => void;
}

export function QueueConfigModal({ onSubmit, onClose }: QueueConfigModalProps) {
  const [formData, setFormData] = useState<QueueConfigFormData>({
    queueName: '',
    prefix: '',
    processFileName: '',
    queueProps: {},
  });

  const queuePropsRef = useRef<Record<string, HTMLInputElement>>({});
  const [focusedPropKey, setFocusedPropKey] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQueuePropChange = (oldKey: string, newKey: string, value: string) => {
    setFormData(prev => {
      const updatedQueueProps = { ...prev.queueProps };
      if (oldKey !== newKey) {
        delete updatedQueueProps[oldKey];
      }
      updatedQueueProps[newKey] = value;
      return { ...prev, queueProps: updatedQueueProps };
    });
    if (oldKey !== newKey) {
      setFocusedPropKey(newKey);
    }
  };

  const addQueueProp = () => {
    const newKey = `prop${Object.keys(formData.queueProps).length + 1}`;
    setFormData(prev => ({
      ...prev,
      queueProps: { ...prev.queueProps, [newKey]: '' },
    }));
    setFocusedPropKey(newKey);
  };

  const removeQueueProp = (keyToRemove: string) => {
    setFormData(prev => {
      const { [keyToRemove]: _, ...rest } = prev.queueProps;
      return { ...prev, queueProps: rest };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  useEffect(() => {
    if (focusedPropKey) {
      queuePropsRef.current[focusedPropKey]?.focus();
      setFocusedPropKey(null);
    }
  }, [focusedPropKey]);

  return (
    <>
        <DialogHeader>
          <DialogTitle>Queue Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogContent >
          <div>
            <Label htmlFor="queueName">Queue Name</Label>
            <Input
              id="queueName"
              name="queueName"
              value={formData.queueName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="prefix">Prefix</Label>
            <Input
              id="prefix"
              name="prefix"
              value={formData.prefix}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="processFileName">Process File Name</Label>
            <div className="mt-1 h-[400px] border border-gray-600 rounded overflow-hidden">
              <MonacoEditor
                height="100%"
                defaultLanguage="javascript"
                value={"console"}
                onChange={(value:string|undefined)=>{}}
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
          <div className="space-y-2">
            <Label>Queue Props</Label>
            {Object.entries(formData.queueProps).map(([key, value]) => (
              <div key={key} className="flex space-x-2">
                <Input
                  placeholder="Prop Name"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    handleQueuePropChange(key, newKey, value);
                  }}
                  ref={(el) => {
                    if (el) queuePropsRef.current[key] = el;
                  }}
                  required
                />
                <Input
                  placeholder="Type (e.g., str, str|None)"
                  value={value}
                  onChange={(e) => handleQueuePropChange(key, key, e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQueueProp(key)}
                  aria-label="Remove queue prop"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addQueueProp} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Queue Prop
            </Button>
          </div>
          </DialogContent>
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
    </>
  );
}


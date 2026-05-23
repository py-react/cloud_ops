import React, { useState } from "react";
import {
  Upload,
  Plus,
  Terminal,
  X,
  FileCode,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const UploadConfig = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      toast.error("Please provide both a name and YAML content");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/kubernertes/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', name, content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add config');
      }

      toast.success("Kubeconfig added successfully");
      setName("");
      setContent("");
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add config");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[0.5rem] shadow-none bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add New Kubeconfig
        </CardTitle>
        <CardDescription>
          Provide a nickname and the full YAML content of your Kubeconfig file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="upload-config-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Config Nickname</label>
            <Input 
              placeholder="e.g. Production-Cluster" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50/50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">YAML Content</label>
              <Badge variant="outline" className="text-[10px] font-mono text-gray-400">
                KUBECONFIG YAML
              </Badge>
            </div>
            <div className="relative">
              <Textarea 
                placeholder="apiVersion: v1..." 
                className="min-h-[200px] font-mono text-xs bg-gray-900 text-gray-100 p-4 rounded-md focus-visible:ring-primary/50"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <FileCode className="absolute bottom-3 right-3 w-5 h-5 text-gray-600 opacity-30" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="bg-gray-50/50 border-t border-gray-100 rounded-b-[0.5rem] p-4 flex justify-between items-center">
        <p className="text-xs text-gray-400 max-w-[60%]">
          Cluster certificates and sensitive tokens will be encrypted using Fernet before being stored in the database.
        </p>
        <Button 
          form="upload-config-form" 
          disabled={isSubmitting} 
          className="bg-primary hover:bg-primary/90 text-white px-6 shadow-sm"
        >
          {isSubmitting ? "Adding..." : "Add Kubeconfig"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Internal Badge for the component
const Badge = ({ children, variant, className }: any) => (
  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${variant === 'outline' ? 'border border-gray-200 text-gray-500' : 'bg-primary/10 text-primary'} ${className}`}>
    {children}
  </span>
);

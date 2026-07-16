import React, { useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileCode, X, FileText, ShieldCheck } from "lucide-react";

export const UploadConfigStep = ({ form }: { form: UseFormReturn<any> }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const content = form.watch("content");
  const fileName = form.watch("name");
  const isSystem = form.watch("is_system");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        form.setValue("content", fileContent);
        if (!form.getValues("name")) {
          const name = file.name.replace(/\.[^/.]+$/, "");
          form.setValue("name", name);
        }
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    form.setValue("content", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Config Nickname</FormLabel>
              <FormControl>
                <Input placeholder="e.g. My-Production-Cluster" {...field} />
              </FormControl>
              <FormDescription>
                A friendly name for this config.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_system"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Configuration Source</FormLabel>
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                <Button
                  type="button"
                  variant={!field.value ? "secondary" : "ghost"}
                  className="flex-1 h-8 text-xs shadow-none"
                  onClick={() => field.onChange(false)}
                >
                  File Upload
                </Button>
                <Button
                  type="button"
                  variant={field.value ? "secondary" : "ghost"}
                  className="flex-1 h-8 text-xs shadow-none"
                  onClick={() => field.onChange(true)}
                >
                  System Path
                </Button>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        {isSystem ? (
          <FormField
            control={form.control}
            name="system_path"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                <FormLabel>Local File Path</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="e.g. ~/.kube/config" {...field} className="pl-10" />
                    <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormDescription>
                  The absolute path to the Kubeconfig file on the server's filesystem.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <FormLabel>Upload Kubeconfig File</FormLabel>
            {!content ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group bg-muted/5"
              >
                <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold">Click to select Kubeconfig</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Select a valid YAML configuration file from your computer.</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="border border-primary/20 bg-primary/5 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">File Selected</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[250px]">
                      {fileName || "kubeconfig.yaml"}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={clearFile}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="content"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-muted/20 border border-muted-foreground/10 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Security Note</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isSystem 
              ? "System-resident configs are not stored in our database. We only store the file path and read it as needed." 
              : "Uploaded configs are encrypted at rest using AES-256 and stored securely in the database."}
          </p>
        </div>
      </div>
    </div>
  );
};

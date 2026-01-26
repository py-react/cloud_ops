import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-shadcn";
import { 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Layers,
  Container,
  Database,
  GitBranch
} from "lucide-react";
import { Control } from "react-hook-form";
import { toast } from "sonner";
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";

interface CompositionPreviewProps {
  control: Control<any>;
  watch: any;
  setValue: any;
  errors: any;
}

interface PreviewData {
  success: boolean;
  composed_yaml: string;
  errors: string[];
  warnings: string[];
  metadata: {
    fragment_count: number;
    fragment_types: string[];
    composition_time_ms: number;
  };
}

const CompositionPreviewStep = ({ control, watch, setValue, errors }: CompositionPreviewProps) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const watchedValues = watch();

  useEffect(() => {
    if (autoRefresh) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 500); // Debounce preview generation
      return () => clearTimeout(timer);
    }
  }, [watchedValues, autoRefresh]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const moduleData = {
        container_profile_ids: watchedValues.container_profile_ids || [],
        volume_profile_ids: watchedValues.volume_profile_ids || [],
        scheduling_profile_ids: watchedValues.scheduling_profile_ids || [],
        resource_profile_ids: watchedValues.resource_profile_ids || [],
        probe_profile_ids: watchedValues.probe_profile_ids || [],
        env_profile_ids: watchedValues.env_profile_ids || [],
        lifecycle_profile_ids: watchedValues.lifecycle_profile_ids || [],
        deployment_config: {
          deployment_name: watchedValues.deployment_name || "preview-deployment",
          namespace: watchedValues.namespace || "default",
          replicas: watchedValues.replicas || 1,
          labels: watchedValues.labels || {},
          annotations: watchedValues.annotations || {},
          service_ports: watchedValues.service_ports || []
        }
      };

      const response = await fetch('/api/integration/kubernetes/composition/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      });

      const result: PreviewData = await response.json();
      setPreviewData(result);
      
      if (!result.success) {
        toast.error(`Composition failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error("Failed to generate preview");
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (previewData?.composed_yaml) {
      navigator.clipboard.writeText(previewData.composed_yaml);
      toast.success("YAML copied to clipboard");
    }
  };

  const downloadYaml = () => {
    if (previewData?.composed_yaml) {
      const blob = new Blob([previewData.composed_yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${watchedValues.deployment_name || 'deployment'}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("YAML downloaded");
    }
  };

  const getTotalModuleCount = () => {
    const modules = [
      'container_profile_ids',
      'volume_profile_ids', 
      'scheduling_profile_ids',
      'resource_profile_ids',
      'probe_profile_ids',
      'env_profile_ids',
      'lifecycle_profile_ids'
    ];
    
    return modules.reduce((sum, field) => {
      const ids = watchedValues[field] || [];
      return sum + (ids?.length || 0);
    }, 0);
  };

  const getModuleTypeStats = () => {
    const fields = [
      'containers',
      'volumes', 
      'scheduling',
      'resources',
      'probes',
      'env',
      'lifecycle'
    ];
    
    const stats: Record<string, number> = {};
    
    fields.forEach(type => {
      const fieldName = `${type}_profile_ids`;
      stats[type] = (watchedValues[fieldName] || []).length;
    });
    
    return stats;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Composition Preview</h3>
          <p className="text-sm text-muted-foreground">
            Real-time preview of how selected modules compose into the final Kubernetes manifest
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FormField
            control={control}
            name="auto_refresh_preview"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setAutoRefresh(e.target.checked);
                    }}
                    className="rounded"
                  />
                </FormControl>
                <FormLabel className="text-sm">Auto Refresh</FormLabel>
              </FormItem>
            )}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalModuleCount()}</div>
            <p className="text-xs text-muted-foreground">Selected for composition</p>
          </CardContent>
        </Card>

        {Object.entries(getModuleTypeStats()).map(([type, count]) => {
          if (count === 0) return null;
          
          const icons: Record<string, any> = {
            containers: Container,
            volumes: Database,
            scheduling: GitBranch,
            resources: GitBranch,
            probes: CheckCircle,
            env: GitBranch,
            lifecycle: GitBranch
          };
          
          const Icon = icons[type] || Layers;
          
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{type}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">profiles selected</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Composition Status */}
      {previewData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {previewData.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={previewData.success ? "default" : "destructive"}>
                {previewData.success ? "Valid Composition" : "Composition Errors"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {previewData.metadata?.fragment_count || 0} fragments
              </Badge>
              <Badge variant="outline">
                {previewData.metadata?.composition_time_ms || 0}ms
              </Badge>
            </div>
          </div>

          {/* Errors and Warnings */}
          {(previewData.errors.length > 0 || previewData.warnings.length > 0) && (
            <div className="space-y-2">
              {previewData.errors.map((error, i) => (
                <div key={i} className="p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              ))}
              {previewData.warnings.map((warning, i) => (
                <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm text-yellow-800">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* YAML Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Generated YAML</h4>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Eye className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadYaml}>
                  <Eye className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <textarea
                readOnly
                value={previewData.composed_yaml || ''}
                className="w-full h-96 p-4 font-mono text-sm bg-slate-50 border rounded-lg resize-none"
                placeholder="Composition preview will appear here..."
              />
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating preview...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!previewData && !loading && getTotalModuleCount() === 0 && (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Modules Selected</h3>
          <p className="text-gray-500 mb-4">
            Select modules in the previous step to see the composition preview
          </p>
          <Button variant="outline" onClick={() => {/* Navigate to module selection step */}}>
            Select Modules
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompositionPreviewStep;
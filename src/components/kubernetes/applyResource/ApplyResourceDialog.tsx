import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MonacoEditor from '@monaco-editor/react';
import { DefaultService } from '@/gingerJs_api_client';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const steps = [
  {
    id: 'yaml',
    label: 'YAML',
    description: 'Paste your Kubernetes YAML manifest.',
    longDescription: 'Paste your Kubernetes YAML manifest below and click Apply to create or update resources in your cluster. This will send the manifest directly to the Kubernetes API.',
  },
];

interface ApplyResourceDialogProps {
  open: boolean;
  onClose: () => void;
}

const ApplyResourceDialog: React.FC<ApplyResourceDialogProps> = ({ open, onClose }) => {
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(steps[0].id);

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await DefaultService.apiKubernertesMethodsApplyPost({
        requestBody: { manifest: yaml },
      });
      setSuccess('Resource applied successfully!');
      setYaml('');
    } catch (err: any) {
      setError(err?.message || 'Failed to apply resource');
    } finally {
      setLoading(false);
      onClose()
    }
  };

  const currentStep = steps.find((s) => s.id === activeTab)!;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 flex flex-col">
        <DialogHeader className="py-4 px-8 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Apply Kubernetes Resource</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col px-8 py-6 overflow-auto">
          {/* Top Bar with Tabs */}
          <div className="flex flex-row pb-2 items-center justify-between mb-6">
            <div className="flex items-center w-full">
              <Tabs
                tabs={steps.map(({ id, label }) => ({ id, label }))}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md">
            {/* Step Information Card */}
            <div className="col-span-1">
              <Card className="pt-6 shadow-none">
                <CardHeader>
                  <CardTitle>{currentStep.label}</CardTitle>
                  <CardDescription>{currentStep.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {currentStep.longDescription}
                  </p>
                </CardContent>
              </Card>
            </div>
            {/* Main Content Area */}
            <div className="col-span-2 min-h-0 px-4 flex flex-col">
              <div className="flex-1 border rounded bg-black/80 overflow-hidden m-12">
                <MonacoEditor
                  height="100%"
                  width="100%"
                  defaultLanguage="yaml"
                  value={yaml}
                  onChange={value => setYaml(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
              {error && <div className="text-red-600 mb-2">{error}</div>}
              {success && <div className="text-green-600 mb-2">{success}</div>}
            </div>
          </div>
        </div>
        <DialogFooter className="px-8 py-4 border-t flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading || !yaml.trim()}>
            {loading ? 'Applying...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyResourceDialog; 
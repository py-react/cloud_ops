import React, { useContext, useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Info,
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { KubeConfigTable } from '@/components/kubernetes/settings/configs/kubeConfigTable';
import { UploadConfigWizard } from '@/components/kubernetes/settings/configs/uploadConfigWizard';
import { KubeContext } from '@/components/kubernetes/contextProvider/KubeContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function KubeConfigManagement() {
  const { fetchconfig } = useContext(KubeContext);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchconfig(); // Refresh the context provider as well
  };

  return (
    <PageLayout
      title="Kubeconfig Management"
      subtitle="Securely store and switch between multiple cluster configuration files."
      icon={FileText}
      actions={
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-[11px] font-medium text-green-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            End-to-End Encrypted
          </div>
          <UploadConfigWizard onUploadSuccess={handleRefresh} />
        </div>
      }
    >
      <div className="space-y-6">
        <KubeConfigTable key={refreshKey} onRefresh={handleRefresh} />
        
        <Alert className="bg-blue-50/50 border-blue-100 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm font-semibold">Pro Tip</AlertTitle>
          <AlertDescription className="text-xs opacity-80 leading-relaxed">
            When you activate a new config, the platform automatically updates its internal Kubernetes client. 
            Existing contexts will be refreshed to reflect the ones defined in your new active file.
            This allows you to manage multiple isolated cluster environments without manual file manipulation.
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  );
}

export default KubeConfigManagement;

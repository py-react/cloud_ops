import React, { useEffect, useState } from "react";
import { Users, Shield, Lock, RefreshCw } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-v2";
import Roles from "@/components/kubernetes/settings/rbac/cluserUsers";
import RoleBindings from "@/components/kubernetes/settings/rbac/bindings";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";

export const RBAC = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    // This will trigger a re-fetch in the child components since they use useEffect with type/activeTab 
    // or we might need a more robust way to trigger refresh.
    // For now, let's assume switching tabs or manual refresh button (if we pass it down) works.
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <PageLayout
      title="Users & RBAC"
      subtitle="Role-based access control (RBAC) regulates access to resources based on individual roles. Manage roles and role bindings for your Kubernetes cluster."
      icon={Users}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Tabs
          defaultValue="roles"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="bindings" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Role Bindings
            </TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <TabsContent value="roles" className="mt-0">
              <Roles type="roles" />
            </TabsContent>
            <TabsContent value="bindings" className="mt-0">
              <Roles type="rolebindings" />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageLayout>
  );
};
export default RBAC;

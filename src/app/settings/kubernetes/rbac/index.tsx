import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-v2";
import Roles from "@/components/kubernetes/settings/rbac/cluserUsers";
// import Roles from "@/components/kubernetes/settings/rbac/roles";
import RoleBindings from "@/components/kubernetes/settings/rbac/bindings";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

export const RBAC = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [data, setData] = useState({ users: [], roles: [], role_bindings: [] });

  const fetchData = ()=>{
    DefaultService.apiKubernertesUserGet(res=>{
      setData(res)
    }).then().catch(err=>toast.error(err))
  }

  useEffect(()=>{
    // fetchData()
  },[])

  return (
    <div title="Kubernetes Resource quota">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Users & RBAC</h1>
        </div>
      </div>
      <div className="space-y-6">
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Access Control</CardTitle>
            <CardDescription>
              Manage users, roles and access control for your Kubernetes cluster
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Role-based access control (RBAC) is a method of regulating
                access to resources based on the roles of individual users. RBAC
                authorization uses the rbac.authorization.k8s.io API group to
                drive authorization decisions.
              </div>
            </div>
          </CardContent>
        </Card>
        <div>
          <Tabs
            defaultValue="users"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="bindings">Role Bindings</TabsTrigger>
            </TabsList>
              <TabsContent value="roles">
                <Roles type={"roles"} />
              </TabsContent>
              <TabsContent value="bindings">
                <Roles type="roles"/>
              </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
export default RBAC;

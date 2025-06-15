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
import RouteDescription from "@/components/route-description";

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
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h2>Users & RBAC</h2>
            </div>
          }
          shortDescription="Manage users, roles and access control for your Kubernetes cluster"
          description="Role-based access control (RBAC) is a method of regulating
                access to resources based on the roles of individual users. RBAC
                authorization uses the rbac.authorization.k8s.io API group to
                drive authorization decisions."
        />
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

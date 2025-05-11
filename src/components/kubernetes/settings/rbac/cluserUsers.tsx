import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Input } from "@/components/ui/input";
import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";

const columns = [
    {header:"",accessor:""}
]

const Roles = ({type}) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = ()=>{
    DefaultService.apiKubernertesResourcesTypeGet({
        type
    }).then(res=>{
        setData(res)
    }).catch(err=>{
        toast.err(err)
    })
  }

  useEffect(()=>{
    fetchData()
  },[])
  
  // Filter contexts based on search term
  const filteredData = data.filter((data) =>
    data.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Cluster Users</CardTitle>
          <CardDescription>Users and service accounts</CardDescription>
        </div>
        <div className="w-full flex items-center max-w-sm gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search Users..."
              className="w-full pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-none">
        <ResourceTable className="p-0" columns={columns} data={filteredData || []} />
      </CardContent>
    </Card>
  );
};

export default Roles;

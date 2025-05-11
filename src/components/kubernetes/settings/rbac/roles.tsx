import React, { useState } from "react";
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

const Roles = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contexts based on search term
  const filteredData = data.filter((data) =>
    data.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Roles & ClusterRoles</CardTitle>
          <CardDescription>Permissions sets that can be assigned</CardDescription>
        </div>
        <div className="w-full flex items-center max-w-sm gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              className="w-full pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-none">
        <ResourceTable className="p-0" columns={[]} data={filteredData || []} />
      </CardContent>
    </Card>
  );
};

export default Roles;

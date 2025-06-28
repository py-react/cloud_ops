import React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, DatabaseIcon } from "lucide-react";

const ResourceQuotaOverview = ({ quota }: { quota: Record<string, any> }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <DatabaseIcon className="w-4 h-4 mt-1" />
          <div className="flex flex-col gap-2">
            <span>Namespace</span>
            <div className="text-sm text-gray-500 break-words">
              {quota.namespace}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
          <CalendarPlus className="w-4 h-4 mt-1" />
          <div className="flex flex-col gap-2">
            <span>Created At</span>
            <div className="text-sm text-gray-500">
              {quota.creation_timestamp
                ? new Date(quota.creation_timestamp).toLocaleString()
                : "Unknown"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceQuotaOverview; 
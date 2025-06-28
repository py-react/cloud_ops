import React, { useEffect } from 'react';
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { QuotaFormValues } from '../../types/quota';
import DeleteQuotaDialog from "../../common/deleteQuota";
import Editor from "@monaco-editor/react";

interface AdvancedTabProps {
  quotaName: string;
  handleDelete: () => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  quotaName,
  handleDelete
}) => {
  
  return (
    <div className="space-y-4 py-4">
      <div className="mt-4 border border-red-200 bg-red-50 rounded-md p-4">
        <h3 className="text-red-700 font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Actions here can result in irreversible changes
        </p>
        <DeleteQuotaDialog 
          quotaName={quotaName}
          onCancel={() => {}}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default AdvancedTab;
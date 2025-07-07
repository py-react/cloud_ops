import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData, addKeyValuePair, updateKeyValuePair, removeKeyValuePair } from "./formUtils";

interface NodeSelectorProps {
  form: UseFormReturn<DeploymentFormData>;
}

const NodeSelector: React.FC<NodeSelectorProps> = ({ form }) => {
  const formData = form.watch();

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          Node Selector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(formData.nodeSelector || {}).map(([key, value]) => (
          <div key={key} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Input
                value={key}
                onChange={(e) =>
                  updateKeyValuePair(
                    form,
                    "nodeSelector",
                    key,
                    e.target.value,
                    value
                  )
                }
                placeholder="key"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={value}
                onChange={(e) =>
                  updateKeyValuePair(form, "nodeSelector", key, key, e.target.value)
                }
                placeholder="value"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeKeyValuePair(form, "nodeSelector", key)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => addKeyValuePair(form, "nodeSelector")}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Node Selector
        </Button>
      </CardContent>
    </Card>
  );
};

export default NodeSelector; 
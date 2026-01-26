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
import { Plus, Trash2, Tag, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData, addKeyValuePair, updateKeyValuePair, removeKeyValuePair } from "./formUtils";

interface LabelsAndAnnotationsProps {
  form: UseFormReturn<DeploymentFormData>;
}

const LabelsAndAnnotations: React.FC<LabelsAndAnnotationsProps> = ({ form }) => {
  const formData = form.watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Labels */}
      <Card className="p-4 shadow-none border">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <Tag className="h-5 w-5 text-slate-600" />
            Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.labels || {}).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Input
                  value={key}
                  onChange={(e) =>
                    updateKeyValuePair(
                      form,
                      "labels",
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
                    updateKeyValuePair(form, "labels", key, key, e.target.value)
                  }
                  placeholder="value"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeKeyValuePair(form, "labels", key)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addKeyValuePair(form, "labels")}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Label
          </Button>
        </CardContent>
      </Card>

      {/* Annotations */}
      <Card className="p-4 shadow-none border">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            Annotations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.annotations || {}).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Input
                  value={key}
                  onChange={(e) =>
                    updateKeyValuePair(
                      form,
                      "annotations",
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
                    updateKeyValuePair(
                      form,
                      "annotations",
                      key,
                      key,
                      e.target.value
                    )
                  }
                  placeholder="value"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeKeyValuePair(form, "annotations", key)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addKeyValuePair(form, "annotations")}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Annotation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabelsAndAnnotations; 
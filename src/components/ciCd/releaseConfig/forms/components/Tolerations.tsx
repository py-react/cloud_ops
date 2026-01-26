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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, HardDrive } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData } from "./formUtils";

interface TolerationsProps {
  form: UseFormReturn<DeploymentFormData>;
}

const Tolerations: React.FC<TolerationsProps> = ({ form }) => {
  const formData = form.watch();

  const addToleration = () => {
    const currentTolerations = form.getValues("tolerations") || [];
    form.setValue("tolerations", [
      ...currentTolerations,
      { key: "", operator: "Equal", value: "", effect: "NoSchedule" },
    ]);
  };

  const removeToleration = (index: number) => {
    const currentTolerations = form.getValues("tolerations") || [];
    form.setValue(
      "tolerations",
      currentTolerations.filter((_, i) => i !== index)
    );
  };

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-slate-600" />
          Tolerations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(formData.tolerations || []).map((toleration, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Key</Label>
              <Input
                {...form.register(`tolerations.${index}.key` as const)}
                placeholder="key"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Operator</Label>
              <Select
                value={toleration.operator || "Equal"}
                onValueChange={(value) => form.setValue(`tolerations.${index}.operator`, value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equal">Equal</SelectItem>
                  <SelectItem value="Exists">Exists</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Value</Label>
              <Input
                {...form.register(`tolerations.${index}.value` as const)}
                placeholder="value"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Effect</Label>
              <Select
                value={toleration.effect || "NoSchedule"}
                onValueChange={(value) => form.setValue(`tolerations.${index}.effect`, value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoSchedule">NoSchedule</SelectItem>
                  <SelectItem value="PreferNoSchedule">PreferNoSchedule</SelectItem>
                  <SelectItem value="NoExecute">NoExecute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeToleration(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addToleration}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Toleration
        </Button>
      </CardContent>
    </Card>
  );
};

export default Tolerations; 
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
import { Plus, Trash2, Network } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData } from "./formUtils";

interface ServicePortsProps {
  form: UseFormReturn<DeploymentFormData>;
}

const ServicePorts: React.FC<ServicePortsProps> = ({ form }) => {
  const formData = form.watch();

  const addServicePort = () => {
    const currentPorts = form.getValues("service_ports") || [];
    form.setValue("service_ports", [
      ...currentPorts,
      { port: 0, target_port: 0, protocol: "TCP" },
    ]);
  };

  const removeServicePort = (index: number) => {
    const currentPorts = form.getValues("service_ports") || [];
    form.setValue(
      "service_ports",
      currentPorts.filter((_, i) => i !== index)
    );
  };

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Network className="h-5 w-5 text-slate-600" />
          Service Ports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.service_ports.map((port, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Port</Label>
              <Input
                type="number"
                value={port.port}
                onChange={(e) => {
                  const newPorts = [...formData.service_ports];
                  newPorts[index].port = parseInt(e.target.value) || 0;
                  form.setValue("service_ports", newPorts);
                }}
                placeholder="80"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Target Port</Label>
              <Input
                type="number"
                value={port.target_port}
                onChange={(e) => {
                  const newPorts = [...formData.service_ports];
                  newPorts[index].target_port =
                    parseInt(e.target.value) || 0;
                  form.setValue("service_ports", newPorts);
                }}
                placeholder="8080"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-medium">Protocol</Label>
              <Select
                value={port.protocol}
                onValueChange={(value: "TCP" | "UDP") => {
                  const newPorts = [...formData.service_ports];
                  newPorts[index].protocol = value;
                  form.setValue("service_ports", newPorts);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="UDP">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeServicePort(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addServicePort}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Port
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServicePorts; 
import React, { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReleaseConfigFormData } from "../ReleaseConfigForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ChevronDown, X, Check } from "lucide-react";

interface ServicePortsSectionProps {
  control: Control<ReleaseConfigFormData>;
}

export const ServicePortsSection: React.FC<ServicePortsSectionProps> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "service_ports"
  });
  const ports = useWatch({ control, name: "service_ports" }) || [];

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [port, setPort] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [protocol, setProtocol] = useState("TCP");

  const handleAddOrUpdate = () => {
    if (!port || !targetPort) return;
    const portObj = { port: Number(port), target_port: Number(targetPort), protocol };
    if (editIdx !== null) {
      update(editIdx, portObj);
      setEditIdx(null);
    } else {
      append(portObj);
    }
    setPort("");
    setTargetPort("");
    setProtocol("TCP");
  };

  const handleEdit = (row: any) => {
    setEditIdx(row.index);
    setPort(row.port.toString());
    setTargetPort(row.target_port.toString());
    setProtocol(row.protocol || "TCP");
  };

  const handleCancel = () => {
    setEditIdx(null);
    setPort("");
    setTargetPort("");
    setProtocol("TCP");
  };

  return (
    <div>
      <div className="flex flex-col items-start justify-between mb-2">
        <FormLabel>Service Ports</FormLabel>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
              <FormDescription className="mt-2">
                {ports.length > 0
                  ? `${ports.length} port${ports.length === 1 ? "" : "s"} configured`
                  : "Add Port configuration"}
              </FormDescription>
              {ports.length > 0 && <ChevronDown className="w-4 h-4" />}
            </div>
          </PopoverTrigger>
          <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
            <ResourceTable
              columns={[
                { header: "Port", accessor: "port" },
                { header: "Target Port", accessor: "target_port" },
                { header: "Protocol", accessor: "protocol" }
              ]}
              data={ports.map((p: any, idx: number) => ({ ...p, index: idx }))}
              onEdit={handleEdit}
              onDelete={(row: any) => remove(row.index)}
              className="p-2 border-[0.5px] border-gray-200 shadow-none"
              tableClassName="max-h-[300px]"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2 mb-2">
        <Input placeholder="Port" type="number" value={port} onChange={e => setPort(e.target.value)} />
        <Input placeholder="Target Port" type="number" value={targetPort} onChange={e => setTargetPort(e.target.value)} />
        <Input placeholder="Protocol" value={protocol} onChange={e => setProtocol(e.target.value)} />
        {editIdx !== null && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 text-red-500 hover:text-red-600" />
            <span>Cancel</span>
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleAddOrUpdate} disabled={!port || !targetPort}>
          <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
          <span>{editIdx !== null ? "Update" : "Add"}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServicePortsSection; 
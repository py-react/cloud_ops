import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Check, ChevronDown } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { SectionProps } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { TooltipWrapper } from "@/components/ui/tooltip";

export function DataConfig({ control, errors }: SectionProps) {
  const { fields: dataFields, append: appendData, remove: removeData, update: updateData } = useFieldArray({
    control,
    name: "data"
  });

  const { fields: binaryDataFields, append: appendBinaryData, remove: removeBinaryData, update: updateBinaryData } = useFieldArray({
    control,
    name: "binaryData"
  });

  const [dataKey, setDataKey] = useState("");
  const [dataValue, setDataValue] = useState("");
  const [binaryDataKey, setBinaryDataKey] = useState("");
  const [binaryDataValue, setBinaryDataValue] = useState("");
  const [isDataPopoverOpen, setIsDataPopoverOpen] = useState(false);
  const [isBinaryDataPopoverOpen, setIsBinaryDataPopoverOpen] = useState(false);
  const [editingDataIndex, setEditingDataIndex] = useState<number | null>(null);
  const [editingBinaryDataIndex, setEditingBinaryDataIndex] = useState<number | null>(null);

  const handleDataConfirm = () => {
    if (dataKey.trim() && dataValue.trim()) {
      if (editingDataIndex !== null) {
        updateData(editingDataIndex, { key: dataKey, value: dataValue });
        setEditingDataIndex(null);
      } else {
        appendData({ key: dataKey, value: dataValue });
      }
      setDataKey("");
      setDataValue("");
    }
  };

  const handleBinaryDataConfirm = () => {
    if (binaryDataKey.trim() && binaryDataValue.trim()) {
      if (editingBinaryDataIndex !== null) {
        updateBinaryData(editingBinaryDataIndex, { key: binaryDataKey, value: binaryDataValue });
        setEditingBinaryDataIndex(null);
      } else {
        appendBinaryData({ key: binaryDataKey, value: binaryDataValue });
      }
      setBinaryDataKey("");
      setBinaryDataValue("");
    }
  };

  const handleDataEdit = (index: number) => {
    const field = dataFields[index];
    setDataKey(field.key);
    setDataValue(field.value);
    setEditingDataIndex(index);
    setIsDataPopoverOpen(false);
  };

  const handleBinaryDataEdit = (index: number) => {
    const field = binaryDataFields[index];
    setBinaryDataKey(field.key);
    setBinaryDataValue(field.value);
    setEditingBinaryDataIndex(index);
    setIsBinaryDataPopoverOpen(false);
  };

  const handleDataCancel = () => {
    setDataKey("");
    setDataValue("");
    setEditingDataIndex(null);
  };

  const handleBinaryDataCancel = () => {
    setBinaryDataKey("");
    setBinaryDataValue("");
    setEditingBinaryDataIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* Data Section */}
      <div className="">
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Data</FormLabel>
          <Popover
            open={isDataPopoverOpen}
            onOpenChange={setIsDataPopoverOpen}
          >
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {dataFields.length > 0
                    ? `${dataFields.length} key-value pair${
                        dataFields.length === 1 ? "" : "s"
                      } configured`
                    : "Add key-value pairs for configuration data"}
                </FormDescription>
                {dataFields.length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className={`!w-[48rem] p-0 border-none shadow-none`}
              align="start"
            >
              <ResourceTable
                columns={[{
                  header: "Key",
                  accessor: "key"
                }, {
                  header: "Value",
                  accessor: "value"
                }]}
                onEdit={(row) => handleDataEdit(row.index)}
                onDelete={(row) => removeData(row.index)}
                data={dataFields.map((field, index) => ({
                  key: <TooltipWrapper content={field.key}>
                    <p className="truncate w-[120px]">{field.key}</p>
                  </TooltipWrapper>,
                  value: <TooltipWrapper content={field.value}>
                    <p className="truncate w-[180px]">{field.value}</p>
                  </TooltipWrapper>,
                  index: index,
                  fullData: field
                }))}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[300px]"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Input */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Key"
            value={dataKey}
            onChange={(e) => setDataKey(e.target.value)}
          />
          <Textarea
            placeholder="Value"
            className="min-h-[40px] bg-white"
            value={dataValue}
            onChange={(e) => setDataValue(e.target.value)}
          />
          <div className="flex items-center justify-end gap-1 w-full">
            {editingDataIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDataCancel}
              >
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Remove</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleDataConfirm}
              disabled={!dataKey.trim() || !dataValue.trim()}
            >
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{editingDataIndex !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Binary Data Section */}
      <div className="">
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel >Binary Data</FormLabel>
          <Popover
            open={isBinaryDataPopoverOpen}
            onOpenChange={setIsBinaryDataPopoverOpen}
          >
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {binaryDataFields.length > 0
                    ? `${binaryDataFields.length} binary data item${
                        binaryDataFields.length === 1 ? "" : "s"
                      } configured`
                    : "Add base64 encoded binary data"}
                </FormDescription>
                {binaryDataFields.length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className={`!w-[48rem] p-0 border-none shadow-none`}
              align="start"
            >
              <ResourceTable
                columns={[{
                  header: "Key",
                  accessor: "key"
                }, {
                  header: "Value",
                  accessor: "value"
                }]}
                onEdit={(row) => handleBinaryDataEdit(row.index)}
                onDelete={(row) => removeBinaryData(row.index)}
                data={binaryDataFields.map((field, index) => ({
                  key: <TooltipWrapper content={field.key}>
                    <p className="truncate w-[120px]">{field.key}</p>
                  </TooltipWrapper>,
                  value: <TooltipWrapper content={field.value}>
                    <p className="truncate w-[180px]">{field.value}</p>
                  </TooltipWrapper>,
                  index: index,
                  fullData: field
                }))}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[300px]"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Binary Data Input */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Key"
            value={binaryDataKey}
            onChange={(e) => setBinaryDataKey(e.target.value)}
          />
          <Textarea
            placeholder="Base64 Value"
            className="min-h-[40px] bg-white"
            value={binaryDataValue}
            onChange={(e) => setBinaryDataValue(e.target.value)}
          />
          <div className="flex items-center justify-end gap-1 w-full">
            {editingBinaryDataIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBinaryDataCancel}
              >
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Remove</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleBinaryDataConfirm}
              disabled={!binaryDataKey.trim() || !binaryDataValue.trim()}
            >
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{editingBinaryDataIndex !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
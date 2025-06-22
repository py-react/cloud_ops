import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X, Check, ChevronDown } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { SectionProps } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { TooltipWrapper } from "@/components/ui/tooltip";

export function LabelsConfig({ control, errors }: SectionProps) {
  // Helper to indicate optional fields
  const OptionalBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
      Optional
    </span>
  );

  const { fields: labelFields, append: appendLabel, remove: removeLabel, update: updateLabel } = useFieldArray({
    control,
    name: "metadata.labels"
  });

  const { fields: annotationFields, append: appendAnnotation, remove: removeAnnotation, update: updateAnnotation } = useFieldArray({
    control,
    name: "metadata.annotations"
  });

  const [labelKey, setLabelKey] = useState("");
  const [labelValue, setLabelValue] = useState("");
  const [annotationKey, setAnnotationKey] = useState("");
  const [annotationValue, setAnnotationValue] = useState("");
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isAnnotationPopoverOpen, setIsAnnotationPopoverOpen] = useState(false);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [editingAnnotationIndex, setEditingAnnotationIndex] = useState<number | null>(null);

  const handleLabelConfirm = () => {
    if (labelKey.trim() && labelValue.trim()) {
      if (editingLabelIndex !== null) {
        updateLabel(editingLabelIndex, { key: labelKey, value: labelValue });
        setEditingLabelIndex(null);
      } else {
        appendLabel({ key: labelKey, value: labelValue });
      }
      setLabelKey("");
      setLabelValue("");
    }
  };

  const handleAnnotationConfirm = () => {
    if (annotationKey.trim() && annotationValue.trim()) {
      if (editingAnnotationIndex !== null) {
        updateAnnotation(editingAnnotationIndex, { key: annotationKey, value: annotationValue });
        setEditingAnnotationIndex(null);
      } else {
        appendAnnotation({ key: annotationKey, value: annotationValue });
      }
      setAnnotationKey("");
      setAnnotationValue("");
    }
  };

  const handleLabelEdit = (index: number) => {
    const field = labelFields[index];
    setLabelKey(field.key);
    setLabelValue(field.value);
    setEditingLabelIndex(index);
    setIsLabelPopoverOpen(false);
  };

  const handleAnnotationEdit = (index: number) => {
    const field = annotationFields[index];
    setAnnotationKey(field.key);
    setAnnotationValue(field.value);
    setEditingAnnotationIndex(index);
    setIsAnnotationPopoverOpen(false);
  };

  const handleLabelCancel = () => {
    setLabelKey("");
    setLabelValue("");
    setEditingLabelIndex(null);
  };

  const handleAnnotationCancel = () => {
    setAnnotationKey("");
    setAnnotationValue("");
    setEditingAnnotationIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* Labels Section */}
      <div className="">
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>
            Labels <OptionalBadge />
          </FormLabel>
          <Popover
            open={isLabelPopoverOpen}
            onOpenChange={setIsLabelPopoverOpen}
          >
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {labelFields.length > 0
                    ? `${labelFields.length} label${
                        labelFields.length === 1 ? "" : "s"
                      } configured`
                    : "Add labels to identify and organize your deployment"}
                </FormDescription>
                {labelFields.length > 0 && <ChevronDown className="w-4 h-4" />}
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
                onEdit={(row) => handleLabelEdit(row.index)}
                onDelete={(row) => removeLabel(row.index)}
                data={labelFields.map((field, index) => ({
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

        {/* Label Input */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Key"
            value={labelKey}
            onChange={(e) => setLabelKey(e.target.value)}
          />
          <Input
            placeholder="Value"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
          />
          <div className="flex items-center justify-end gap-1 w-full">
            {editingLabelIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLabelCancel}
              >
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Remove</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleLabelConfirm}
              disabled={!labelKey.trim() || !labelValue.trim()}
            >
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{editingLabelIndex !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Annotations Section */}
      <div className="">
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>
            Annotations <OptionalBadge />
          </FormLabel>
          <Popover
            open={isAnnotationPopoverOpen}
            onOpenChange={setIsAnnotationPopoverOpen}
          >
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {annotationFields.length > 0
                    ? `${annotationFields.length} annotation${
                        annotationFields.length === 1 ? "" : "s"
                      } configured`
                    : "Add annotations to store arbitrary metadata"}
                </FormDescription>
                {annotationFields.length > 0 && <ChevronDown className="w-4 h-4" />}
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
                onEdit={(row) => handleAnnotationEdit(row.index)}
                onDelete={(row) => removeAnnotation(row.index)}
                data={annotationFields.map((field, index) => ({
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

        {/* Annotation Input */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Key"
            value={annotationKey}
            onChange={(e) => setAnnotationKey(e.target.value)}
          />
          <Input
            placeholder="Value"
            value={annotationValue}
            onChange={(e) => setAnnotationValue(e.target.value)}
          />
          <div className="flex items-center justify-end gap-1 w-full">
            {editingAnnotationIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAnnotationCancel}
              >
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Remove</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleAnnotationConfirm}
              disabled={!annotationKey.trim() || !annotationValue.trim()}
            >
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{editingAnnotationIndex !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
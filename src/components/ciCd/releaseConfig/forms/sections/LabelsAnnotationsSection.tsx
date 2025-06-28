import React, { useState } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReleaseConfigFormData } from "../ReleaseConfigForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ChevronDown, X, Check } from "lucide-react";

interface LabelsAnnotationsSectionProps {
  control: Control<ReleaseConfigFormData>;
  setValue: UseFormSetValue<ReleaseConfigFormData>;
}

export const LabelsAnnotationsSection: React.FC<LabelsAnnotationsSectionProps> = ({ control, setValue }) => {
  // Labels
  const [isLabelsPopoverOpen, setIsLabelsPopoverOpen] = useState(false);
  const [labelKey, setLabelKey] = useState("");
  const [labelValue, setLabelValue] = useState("");
  const [editLabelKey, setEditLabelKey] = useState<string | null>(null);
  const labels = useWatch({ control, name: "labels" }) || {};

  // Annotations
  const [isAnnotationsPopoverOpen, setIsAnnotationsPopoverOpen] = useState(false);
  const [annotationKey, setAnnotationKey] = useState("");
  const [annotationValue, setAnnotationValue] = useState("");
  const [editAnnotationKey, setEditAnnotationKey] = useState<string | null>(null);
  const annotations = useWatch({ control, name: "annotations" }) || {};

  // Label handlers
  const handleAddOrUpdateLabel = () => {
    if (!labelKey) return;
    const newLabels = { ...labels };
    if (editLabelKey && editLabelKey !== labelKey) {
      delete newLabels[editLabelKey];
    }
    newLabels[labelKey] = labelValue;
    setValue("labels", newLabels);
    setLabelKey("");
    setLabelValue("");
    setEditLabelKey(null);
  };
  const handleEditLabel = (row: any) => {
    setEditLabelKey(row.key);
    setLabelKey(row.key);
    setLabelValue(row.value);
  };
  const handleRemoveLabel = (row: any) => {
    const newLabels = { ...labels };
    delete newLabels[row.key];
    setValue("labels", newLabels);
    if (editLabelKey === row.key) {
      setEditLabelKey(null);
      setLabelKey("");
      setLabelValue("");
    }
  };
  const handleCancelLabel = () => {
    setEditLabelKey(null);
    setLabelKey("");
    setLabelValue("");
  };

  // Annotation handlers
  const handleAddOrUpdateAnnotation = () => {
    if (!annotationKey) return;
    const newAnnotations = { ...annotations };
    if (editAnnotationKey && editAnnotationKey !== annotationKey) {
      delete newAnnotations[editAnnotationKey];
    }
    newAnnotations[annotationKey] = annotationValue;
    setValue("annotations", newAnnotations);
    setAnnotationKey("");
    setAnnotationValue("");
    setEditAnnotationKey(null);
  };
  const handleEditAnnotation = (row: any) => {
    setEditAnnotationKey(row.key);
    setAnnotationKey(row.key);
    setAnnotationValue(row.value);
  };
  const handleRemoveAnnotation = (row: any) => {
    const newAnnotations = { ...annotations };
    delete newAnnotations[row.key];
    setValue("annotations", newAnnotations);
    if (editAnnotationKey === row.key) {
      setEditAnnotationKey(null);
      setAnnotationKey("");
      setAnnotationValue("");
    }
  };
  const handleCancelAnnotation = () => {
    setEditAnnotationKey(null);
    setAnnotationKey("");
    setAnnotationValue("");
  };

  return (
    <div className="space-y-8">
      {/* Labels */}
      <div>
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Labels</FormLabel>
          <Popover open={isLabelsPopoverOpen} onOpenChange={setIsLabelsPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {Object.keys(labels).length > 0
                    ? `${Object.keys(labels).length} label${Object.keys(labels).length === 1 ? "" : "s"} configured`
                    : "Add label key-value pairs"}
                </FormDescription>
                {Object.keys(labels).length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="!w-[32rem] p-0 border-none shadow-none" align="start">
              <ResourceTable
                columns={[
                  { header: "Key", accessor: "key" },
                  { header: "Value", accessor: "value" }
                ]}
                data={Object.entries(labels).map(([key, value]) => ({ key, value }))}
                onEdit={handleEditLabel}
                onDelete={handleRemoveLabel}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[200px]"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 mb-2">
          <Input placeholder="Key" value={labelKey} onChange={e => setLabelKey(e.target.value)} />
          <Input placeholder="Value" value={labelValue} onChange={e => setLabelValue(e.target.value)} />
          {editLabelKey !== null && (
            <Button type="button" variant="outline" onClick={handleCancelLabel}>
              <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              <span>Cancel</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleAddOrUpdateLabel} disabled={!labelKey}>
            <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
            <span>{editLabelKey !== null ? "Update" : "Add"}</span>
          </Button>
        </div>
      </div>
      {/* Annotations */}
      <div>
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Annotations</FormLabel>
          <Popover open={isAnnotationsPopoverOpen} onOpenChange={setIsAnnotationsPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {Object.keys(annotations).length > 0
                    ? `${Object.keys(annotations).length} annotation${Object.keys(annotations).length === 1 ? "" : "s"} configured`
                    : "Add annotation key-value pairs"}
                </FormDescription>
                {Object.keys(annotations).length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="!w-[32rem] p-0 border-none shadow-none" align="start">
              <ResourceTable
                columns={[
                  { header: "Key", accessor: "key" },
                  { header: "Value", accessor: "value" }
                ]}
                data={Object.entries(annotations).map(([key, value]) => ({ key, value }))}
                onEdit={handleEditAnnotation}
                onDelete={handleRemoveAnnotation}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[200px]"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 mb-2">
          <Input placeholder="Key" value={annotationKey} onChange={e => setAnnotationKey(e.target.value)} />
          <Input placeholder="Value" value={annotationValue} onChange={e => setAnnotationValue(e.target.value)} />
          {editAnnotationKey !== null && (
            <Button type="button" variant="outline" onClick={handleCancelAnnotation}>
              <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              <span>Cancel</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleAddOrUpdateAnnotation} disabled={!annotationKey}>
            <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
            <span>{editAnnotationKey !== null ? "Update" : "Add"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LabelsAnnotationsSection; 
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { SectionProps } from "../types";

export function LabelsConfig({ control, errors }: SectionProps) {
  const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
    control,
    name: "metadata.labels"
  });

  const { fields: annotationFields, append: appendAnnotation, remove: removeAnnotation } = useFieldArray({
    control,
    name: "metadata.annotations"
  });

  return (
    <div className="space-y-8">
      {/* Labels Section */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <FormLabel className="text-lg">Labels</FormLabel>
              <FormDescription className="mt-1">Add key-value pairs for labels</FormDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendLabel({ key: "", value: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Add Label
            </Button>
          </div>
          <div className="space-y-3">
            {labelFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <FormField
                  control={control}
                  name={`metadata.labels.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormControl>
                        <Input placeholder="Label Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`metadata.labels.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-[2] min-w-[180px]">
                      <FormControl>
                        <Input placeholder="Label Value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1"
                  onClick={() => removeLabel(index)}
                  aria-label="Remove Label"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Annotations Section */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <FormLabel className="text-lg">Annotations</FormLabel>
              <FormDescription className="mt-1">Add key-value pairs for annotations</FormDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendAnnotation({ key: "", value: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Add Annotation
            </Button>
          </div>
          <div className="space-y-3">
            {annotationFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <FormField
                  control={control}
                  name={`metadata.annotations.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormControl>
                        <Input placeholder="Annotation Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`metadata.annotations.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-[2] min-w-[180px]">
                      <FormControl>
                        <Input placeholder="Annotation Value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1"
                  onClick={() => removeAnnotation(index)}
                  aria-label="Remove Annotation"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
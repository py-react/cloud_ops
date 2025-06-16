import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { ConfigMapFormData, SectionProps } from "../types";

export function DataConfig({ control, errors }: SectionProps) {
  const { fields: dataFields, append: appendData, remove: removeData } = useFieldArray({
    control,
    name: "data"
  });

  const { fields: binaryDataFields, append: appendBinaryData, remove: removeBinaryData } = useFieldArray({
    control,
    name: "binaryData"
  });

  return (
    <div className="space-y-8">
      {/* Data Section */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <FormLabel className="text-lg">Data</FormLabel>
              <FormDescription className="mt-1">Add key-value pairs for configuration data</FormDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendData({ key: "", value: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Add Data
            </Button>
          </div>
          <div className="space-y-3">
            {dataFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <FormField
                  control={control}
                  name={`data.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormControl>
                        <Input placeholder="Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`data.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-[2] min-w-[180px]">
                      <FormControl>
                        <Textarea placeholder="Value" className="min-h-[40px]" {...field} />
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
                  onClick={() => removeData(index)}
                  aria-label="Remove Data"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Binary Data Section */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <FormLabel className="text-lg">Binary Data</FormLabel>
              <FormDescription className="mt-1">Add base64 encoded binary data</FormDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendBinaryData({ key: "", value: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Add Binary Data
            </Button>
          </div>
          <div className="space-y-3">
            {binaryDataFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <FormField
                  control={control}
                  name={`binaryData.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormControl>
                        <Input placeholder="Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`binaryData.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-[2] min-w-[180px]">
                      <FormControl>
                        <Textarea placeholder="Base64 Value" className="min-h-[40px]" {...field} />
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
                  onClick={() => removeBinaryData(index)}
                  aria-label="Remove Binary Data"
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
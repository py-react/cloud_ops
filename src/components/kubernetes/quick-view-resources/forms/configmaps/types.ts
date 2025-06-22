import { z } from "zod";
import { Control, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

const keyValuePairSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string()
});

export const configMapSchema = z.object({
  metadata: z.object({
    name: z.string().min(1, "Name is required"),
    namespace: z.string().optional().default("default"),
    labels: z.array(keyValuePairSchema).optional().default([]),
    annotations: z.array(keyValuePairSchema).optional().default([])
  }),
  data: z.array(keyValuePairSchema).optional().default([]),
  binaryData: z.array(keyValuePairSchema).optional().default([]),
  immutable: z.boolean().optional().default(false)
});

export type ConfigMapFormData = z.infer<typeof configMapSchema>;

export interface ConfigMapFormProps {
  onSubmit: (data: ConfigMapFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<ConfigMapFormData>;
}

export interface SectionProps {
  control: Control<ConfigMapFormData>;
  errors: FieldErrors<ConfigMapFormData>;
  watch: UseFormWatch<ConfigMapFormData>;
  setValue: UseFormSetValue<ConfigMapFormData>;
} 
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, name, type = "text", placeholder, required = false }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input type={type} id={name} name={name} placeholder={placeholder} required={required} />
    </div>
  )
}

export default FormInput


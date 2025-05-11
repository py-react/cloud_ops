import React from 'react'
import { useForm } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import type { CreateStorageParams } from '@/types/storage'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateVolumeFormProps {
  onClose: () => void
  onSubmitHandler: (data:CreateStorageParams) => Promise<void>;

}

export function CreateStorageForm({ onClose,onSubmitHandler }: CreateVolumeFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateStorageParams>({
    defaultValues: {
      driver: 'local',
      driverOpts: {},
      labels: {},
    }
  })

  const [driverOpts, setDriverOpts] = React.useState<[string, string][]>([['', '']])
  const [labels, setLabels] = React.useState<[string, string][]>([['', '']])

  const onSubmit = async (data: CreateStorageParams) => {
    try {
      // Convert driverOpts and labels arrays to objects
      data.driverOpts = Object.fromEntries(driverOpts.filter(([key, value]) => key && value))
      data.labels = Object.fromEntries(labels.filter(([key, value]) => key && value).map(([key,value])=>([`com.docker.compose.${key}`,value])))
      await onSubmitHandler(data)
      console.log('Creating volume:', data)
      // TODO: Implement volume creation
    } catch (error) {
      console.error('Failed to create volume:', error)
    }
  }

  const addDriverOpt = () => setDriverOpts([...driverOpts, ['', '']])
  const removeDriverOpt = (index: number) => setDriverOpts(driverOpts.filter((_, i) => i !== index))
  const updateDriverOpt = (index: number, key: string, value: string) => {
    const newDriverOpts = [...driverOpts]
    newDriverOpts[index] = [key, value]
    setDriverOpts(newDriverOpts)
  }

  const addLabel = () => setLabels([...labels, ['', '']])
  const removeLabel = (index: number) => setLabels(labels.filter((_, i) => i !== index))
  const updateLabel = (index: number, key: string, value: string) => {
    const newLabels = [...labels]
    newLabels[index] = [key, value]
    setLabels(newLabels)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Volume Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="my-volume"
        />
        <p className="text-sm text-muted-foreground">
          Leave empty to generate a random name
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="driver">Driver</Label>
        <Select onValueChange={(value) => setValue('driver', value)} defaultValue="local">
          <SelectTrigger>
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">local</SelectItem>
            <SelectItem value="nfs">nfs</SelectItem>
            <SelectItem value="cifs">cifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Driver Options</Label>
        {driverOpts.map(([key, value], index) => (
          <div key={index} className="flex space-x-2">
            <Input
              placeholder="Key"
              value={key}
              onChange={(e) => updateDriverOpt(index, e.target.value, value)}
            />
            <Input
              placeholder="Value"
              value={value}
              onChange={(e) => updateDriverOpt(index, key, e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeDriverOpt(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addDriverOpt}>
          <Plus className="mr-2 h-4 w-4" /> Add Driver Option
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Labels</Label>
        {labels.map(([key, value], index) => (
          <div key={index} className="flex space-x-2">
            <Input
              placeholder="Key"
              value={key}
              onChange={(e) => updateLabel(index, e.target.value, value)}
            />
            <Input
              placeholder="Value"
              value={value}
              onChange={(e) => updateLabel(index, key, e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeLabel(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLabel}>
          <Plus className="mr-2 h-4 w-4" /> Add Label
        </Button>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create Volume
        </Button>
      </div>
    </form>
  )
}


'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UpdateNodeFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function UpdateNodeForm({ onSubmit, onClose }: UpdateNodeFormProps) {
  const [availability, setAvailability] = useState('')
  const [role, setRole] = useState('')
  const [labels, setLabels] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      availability,
      role,
      labels,
    })
  }

  const addLabel = () => {
    setLabels({ ...labels, '': '' })
  }

  const updateLabel = (oldKey: string, newKey: string, value: string) => {
    const newLabels = { ...labels }
    if (oldKey !== newKey) {
      delete newLabels[oldKey]
    }
    newLabels[newKey] = value
    setLabels(newLabels)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="availability">Availability</Label>
        <Select onValueChange={setAvailability}>
          <SelectTrigger>
            <SelectValue placeholder="Select availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pause">Pause</SelectItem>
            <SelectItem value="drain">Drain</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worker">Worker</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Labels</Label>
        {Object.entries(labels).map(([key, value], index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <Input
              placeholder="Key"
              value={key}
              onChange={(e) => updateLabel(key, e.target.value, value)}
            />
            <Input
              placeholder="Value"
              value={value}
              onChange={(e) => updateLabel(key, key, e.target.value)}
            />
          </div>
        ))}
        <Button type="button" onClick={addLabel} variant="outline">
          Add Label
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Update Node
        </Button>
      </div>
    </form>
  )
}


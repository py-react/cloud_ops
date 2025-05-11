'use client'

import React,{ useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UpdateServiceFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function UpdateServiceForm({ onSubmit, onClose }: UpdateServiceFormProps) {
  const [image, setImage] = useState('')
  const [replicas, setReplicas] = useState('')
  const [env, setEnv] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      image,
      replicas: replicas ? parseInt(replicas) : undefined,
      env,
    })
  }

  const addEnv = () => {
    setEnv({ ...env, '': '' })
  }

  const updateEnv = (oldKey: string, newKey: string, value: string) => {
    const newEnv = { ...env }
    if (oldKey !== newKey) {
      delete newEnv[oldKey]
    }
    newEnv[newKey] = value
    setEnv(newEnv)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Enter image name"
        />
      </div>
      <div>
        <Label htmlFor="replicas">Replicas</Label>
        <Input
          type="number"
          id="replicas"
          value={replicas}
          onChange={(e) => setReplicas(e.target.value)}
          placeholder="Enter number of replicas"
        />
      </div>
      <div>
        <Label>Environment Variables</Label>
        {Object.entries(env).map(([key, value], index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <Input
              placeholder="Key"
              value={key}
              onChange={(e) => updateEnv(key, e.target.value, value)}
            />
            <Input
              placeholder="Value"
              value={value}
              onChange={(e) => updateEnv(key, key, e.target.value)}
            />
          </div>
        ))}
        <Button type="button" onClick={addEnv} variant="outline" className="mt-2">
          Add Environment Variable
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Update Service
        </Button>
      </div>
    </form>
  )
}


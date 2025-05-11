'use client'

import react,{ useState } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UpdateSwarmFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function UpdateSwarmForm({ onSubmit, onClose }: UpdateSwarmFormProps) {
  const [rotateWorkerToken, setRotateWorkerToken] = useState(false)
  const [rotateManagerToken, setRotateManagerToken] = useState(false)
  const [rotateManagerUnlockKey, setRotateManagerUnlockKey] = useState(false)
  const [taskHistoryLimit, setTaskHistoryLimit] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      rotateWorkerToken,
      rotateManagerToken,
      rotateManagerUnlockKey,
      taskHistoryLimit: taskHistoryLimit ? parseInt(taskHistoryLimit) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rotate_worker_token" 
          checked={rotateWorkerToken} 
          onCheckedChange={(checked) => setRotateWorkerToken(checked as boolean)} 
        />
        <Label htmlFor="rotate_worker_token">Rotate Worker Token</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rotate_manager_token" 
          checked={rotateManagerToken} 
          onCheckedChange={(checked) => setRotateManagerToken(checked as boolean)} 
        />
        <Label htmlFor="rotate_manager_token">Rotate Manager Token</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rotate_manager_unlock_key" 
          checked={rotateManagerUnlockKey} 
          onCheckedChange={(checked) => setRotateManagerUnlockKey(checked as boolean)} 
        />
        <Label htmlFor="rotate_manager_unlock_key">Rotate Manager Unlock Key</Label>
      </div>
      <div>
        <Label htmlFor="task_history_limit">Task History Limit</Label>
        <Input
          type="number"
          id="task_history_limit"
          value={taskHistoryLimit}
          onChange={(e) => setTaskHistoryLimit(e.target.value)}
          placeholder="Enter task history limit"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Update Swarm
        </Button>
      </div>
    </form>
  )
}


import React, { useEffect, useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DefaultService } from '@/gingerJs_api_client'
import { toast } from 'sonner'

interface PATItem {
  id: number
  name: string
  active: boolean
  created_at: string
  last_used_at?: string
  scopes?: string[]
}

const ManagePatsDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [pats, setPats] = useState<PATItem[]>([])
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState<boolean | null>(null)
  const [pollInterval, setPollInterval] = useState<number>(300)

  const fetchPats = async () => {
    try {
      const res = await DefaultService.apiIntegrationGithubPatGet()
      const data: any = res as any
      setPats(data || [])
    } catch (err: any) {
      toast.error(err.message || String(err))
    }
  }

  useEffect(() => { if (open) fetchPats() }, [open])

  useEffect(() => {
    const fetchPollingStatus = async () => {
      try {
        const res: any = await DefaultService.apiIntegrationGithubPollingGet()
        if (res) {
          setPollingEnabled(res.enabled)
          setPollInterval(res.interval_seconds || 300)
        }
      } catch (err: any) {
        // ignore
      }
    }
    if (open) fetchPollingStatus()
  }, [open])

  const handleAdd = async () => {
    setAddError(null)
    try {
      const res = await DefaultService.apiIntegrationGithubPatPost({ requestBody: { name, token, active: false } })
      const body: any = res as any
      if (body && body.success) {
        toast.success('PAT added')
        setName('')
        setToken('')
        fetchPats()
      } else {
        toast.success('PAT added')
        setName('')
        setToken('')
        fetchPats()
      }
    } catch (err: any) {
      // try to extract server detail message (FastAPI HTTPException detail)
      let message = null
      try {
        message = err?.response?.data?.detail || err?.response?.data || err?.message || String(err)
      } catch (_) {
        message = err?.message || String(err)
      }
      setAddError(String(message))
      toast.error(String(message))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await DefaultService.apiIntegrationGithubPatDelete({ id })
      const body: any = res as any
      if (body && body.success) {
        toast.success('PAT deleted')
        fetchPats()
      } else {
        toast.success('PAT deleted')
        fetchPats()
      }
    } catch (err: any) { toast.error(err.message || String(err)) }
  }

  const handleSetActive = async (id: number) => {
    try {
      const res = await DefaultService.apiIntegrationGithubPatPut({ id })
      const body: any = res as any
      if (body && body.success) {
        toast.success('Active PAT updated')
        fetchPats()
      } else {
        toast.success('Active PAT updated')
        fetchPats()
      }
    } catch (err: any) { toast.error(err.message || String(err)) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage PATs</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage GitHub PATs</DialogTitle>
          <DialogDescription>Store and rotate GitHub Personal Access Tokens used by the SCM poller.</DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">SCM Polling</div>
              <div className="text-xs text-slate-500">Enable background polling for configured repositories</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-700">{pollingEnabled ? 'Enabled' : pollingEnabled === false ? 'Disabled' : 'Unknown'}</div>
              <Button size="sm" onClick={async () => {
                try {
                  const target = !pollingEnabled
                  await DefaultService.apiIntegrationGithubPollingPut({ requestBody: { enabled: target, interval_seconds: pollInterval } })
                  setPollingEnabled(target)
                  toast.success(`Polling ${target ? 'enabled' : 'disabled'}`)
                } catch (err: any) {
                  toast.error(err?.message || String(err))
                }
              }}>{pollingEnabled ? 'Disable' : 'Enable'}</Button>
            </div>
          </div>
          <div className="mb-4 space-y-2">
            {pats.map(p => (
              <div key={p.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <div className="font-medium">{p.name} {p.active && <span className="text-sm text-green-600">(active)</span>}</div>
                  <div className="text-xs text-slate-500">Created: {new Date(p.created_at).toLocaleString()}</div>
                  {p.scopes && p.scopes.length > 0 && (
                    <div className="text-xs text-slate-500">Scopes: {p.scopes.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!p.active && <Button size="sm" onClick={() => handleSetActive(p.id)}>Set active</Button>}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-2">Add new PAT</div>
            <input className="border p-2 w-full mb-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Token" type="password" value={token} onChange={e => setToken(e.target.value)} />
            {addError && <div className="text-sm text-red-600 mb-2">{addError}</div>}
            <div className="flex justify-end">
              <Button onClick={handleAdd}>Add PAT</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManagePatsDialog

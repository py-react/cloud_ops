import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DefaultService } from '@/gingerJs_api_client'
import { toast } from 'sonner'
import {
  Settings2,
  Plus,
  RefreshCw,
  Trash2,
  ChevronRight,
  Loader2,
  Key,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/libs/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface PATItem {
  id: number
  name: string
  active: boolean
  created_at: string
  last_used_at?: string
  scopes?: string[]
}

const steps = [
  {
    id: 'manage',
    label: 'Active Tokens',
    icon: ShieldCheck,
    description: 'Manage current PATs',
    longDescription: 'View, activate, or remove GitHub Personal Access Tokens used for repository polling and interaction.'
  },
  {
    id: 'add',
    label: 'Create Token',
    icon: Plus,
    description: 'Add new credential',
    longDescription: 'Add a new GitHub PAT to your workspace. Ensure the token has sufficient scopes for repository reading.'
  }
]

const ManagePatsDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(steps[0].id)
  const [pats, setPats] = useState<PATItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pollingEnabled, setPollingEnabled] = useState<boolean | null>(null)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newToken, setNewToken] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPats = async () => {
    setLoading(true)
    try {
      const res = await DefaultService.apiIntegrationGithubPatGet()
      setPats(res as any || [])
    } catch (err: any) {
      toast.error(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchPollingStatus = async () => {
    try {
      const res: any = await DefaultService.apiIntegrationGithubPollingGet()
      if (res) {
        setPollingEnabled(res.enabled)
      }
    } catch (err: any) { }
  }

  useEffect(() => {
    if (open) {
      fetchPats()
      fetchPollingStatus()
    }
  }, [open])

  const handleCreatePat = async () => {
    if (!newName || !newToken) {
      toast.error("Please provide both name and token")
      return
    }
    setSubmitting(true)
    try {
      await DefaultService.apiIntegrationGithubPatPost({
        requestBody: { name: newName, token: newToken, active: false }
      })
      toast.success('PAT added successfully')
      setNewName('')
      setNewToken('')
      fetchPats()
      setActiveTab('manage')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add PAT')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this PAT?')) return
    try {
      await DefaultService.apiIntegrationGithubPatDelete({ id })
      toast.success('PAT deleted')
      fetchPats()
    } catch (err: any) {
      toast.error(err.message || String(err))
    }
  }

  const handleSetActive = async (id: number) => {
    try {
      await DefaultService.apiIntegrationGithubPatPut({ id })
      toast.success('Active PAT updated')
      fetchPats()
    } catch (err: any) {
      toast.error(err.message || String(err))
    }
  }

  const handleTogglePolling = async () => {
    try {
      const target = !pollingEnabled
      await DefaultService.apiIntegrationGithubPollingPut({
        requestBody: { enabled: target, interval_seconds: 300 }
      })
      setPollingEnabled(target)
      toast.success(`SCM Polling ${target ? 'enabled' : 'disabled'}`)
    } catch (err: any) {
      toast.error(err?.message || String(err))
    }
  }

  const currentStep = steps.find(s => s.id === activeTab)!
  const Icon = currentStep.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
          <Settings2 className="w-3.5 h-3.5 mr-2" />
          Manage PATs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <span>Manage PATs</span>
          </DialogTitle>
          <DialogDescription className="text-sm font-medium">
            Configure GitHub Personal Access Tokens for repository polling and interaction.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full min-h-0">
          <div className="flex shrink-0 min-h-0 h-[600px]">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-border/30 bg-muted/20 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-1">
                  {steps.map((step) => {
                    const StepIcon = step.icon;
                    const isActive = activeTab === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => setActiveTab(step.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-left",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                        )}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate leading-none mb-1">{step.label}</div>
                          <div className="text-[11px] opacity-70 truncate leading-none font-medium">{step.description}</div>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
                      </button>
                    )
                  })}

                  <div className="pt-4 mt-4 border-t border-border/40">
                    <div className="px-3 py-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Polling Status</h4>
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-xl border border-border/40 bg-background/50",
                        pollingEnabled ? "border-emerald-500/20" : "border-amber-500/20"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            pollingEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          )} />
                          <span className="text-[11px] font-bold text-foreground">
                            {pollingEnabled ? 'Active' : 'Stopped'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-lg text-primary hover:bg-primary/10"
                          onClick={handleTogglePolling}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="px-8 py-8 space-y-8 pb-12">
                  {/* Standardized Header */}
                  <div className="flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary ring-1 ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{currentStep.label}</h3>
                      <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                        {currentStep.longDescription}
                      </p>
                    </div>
                  </div>

                  {/* Main Area */}
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === 'manage' ? (
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Fetching credentials from secure vault...</p>
                          </div>
                        ) : pats.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {pats.map((p) => (
                              <div
                                key={p.id}
                                className={cn(
                                  "group flex items-center justify-between p-4 rounded-xl border border-border/40 transition-all duration-300 hover:shadow-md",
                                  p.active ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "hover:bg-muted/30"
                                )}
                              >
                                <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-foreground truncate">{p.name}</span>
                                    {p.active && (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-1.5 py-0 text-[9px] font-black uppercase ring-1 ring-emerald-500/20">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground/60 tracking-tight">
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> {new Date(p.created_at).toLocaleDateString()}</span>
                                    {p.scopes && p.scopes.length > 0 && (
                                      <span className="hidden sm:block truncate">• Scopes: {p.scopes.join(', ')}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!p.active && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-[11px] font-bold"
                                      onClick={() => handleSetActive(p.id)}
                                    >
                                      Use Token
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                    onClick={() => handleDelete(p.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-border/60 rounded-2xl bg-muted/10 opacity-60">
                            <Key className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-sm font-bold text-muted-foreground">No PATs Configured</p>
                            <p className="text-[12px] font-medium text-muted-foreground/60 text-center mt-1">Add your first token to start polling GitHub repositories.</p>
                            <Button variant="ghost" className="mt-4 text-xs font-bold gap-2" onClick={() => setActiveTab('add')}>
                              Create Token <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 max-w-lg animate-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                              Token Display Name <Badge variant="outline" className="ml-2 border-none bg-red-500/10 text-red-500 text-[8px] px-1 py-0">Required</Badge>
                            </label>
                            <Input
                              placeholder="e.g., CI/CD Pipeline Token"
                              className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl px-4 text-sm"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                              Access Token <Badge variant="outline" className="ml-2 border-none bg-red-500/10 text-red-500 text-[8px] px-1 py-0">Required</Badge>
                            </label>
                            <Input
                              placeholder="ghp_xxxxxxxxxxxx"
                              type="password"
                              className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl px-4 text-sm font-mono"
                              value={newToken}
                              onChange={(e) => setNewToken(e.target.value)}
                            />
                          </div>

                          <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl space-y-3 mt-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-lg text-primary shadow-sm border border-border/30">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-foreground">Security Note</span>
                            </div>
                            <p className="text-[12px] font-medium text-muted-foreground leading-relaxed leading-tight opacity-80">
                              Tokens are stored as encrypted blobs and are never exposed in plaintext after creation. Ensure your token has `repo` and `workflow` scopes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Sticky Footer */}
              <div className="py-3 px-8 bg-background/95 backdrop-blur-xl border-t border-border/40 flex justify-end items-center z-20 shrink-0">
                <div className="flex items-center gap-3">
                  <DialogClose asChild>
                    <Button variant="outline" className="h-9 text-xs font-semibold">
                      Close
                    </Button>
                  </DialogClose>

                  {activeTab === 'add' && (
                    <Button
                      onClick={handleCreatePat}
                      disabled={submitting}
                      variant="gradient"
                      className="h-9 text-xs font-bold px-6 shadow-lg shadow-primary/20"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Token
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ManagePatsDialog

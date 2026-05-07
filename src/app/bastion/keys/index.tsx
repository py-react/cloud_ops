import React, { useState, useEffect, useMemo } from 'react';
import {
  Key, Plus, Search, Loader2, Trash2, Send, ShieldOff, Download,
  Terminal, Shield, ShieldAlert, KeyRound, HardDrive, CheckCircle2,
  Lock, Globe, ShieldCheck, Zap, RefreshCw, AlertCircle, Server,
  UserCog, Fingerprint, Activity, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import FormWizard from "@/components/wizard/form-wizard";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface SSHKey {
  id: number;
  name: string;
  user_id: string;
  created_at?: string;
  is_active: boolean;
  public_key: string;
}

interface System {
  id: number;
  name: string;
  ip_address: string;
}

interface KeyDeployment {
  id: number;
  system_id: number;
  system_name: string;
  system_ip: string;
  linux_username: string;
  privilege_level: string;
  status: 'pending' | 'active' | 'failed' | 'revoking' | 'revoke_failed';
  last_error?: string;
  restrictions?: any;
  is_system_managed: boolean;
  created_at: string;
}

const addKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  user_id: z.string().min(1, "User ID is required"),
  mode: z.enum(['generate', 'import']),
  public_key: z.string().optional(),
  install_local: z.boolean().optional(),
});

const deploySchema = z.object({
  system_id: z.string().min(1, "Select a target system"),
  linux_username: z.string().optional(),
  privilege_level: z.enum(['user', 'sudo', 'root']).default('user'),
  is_system_managed: z.boolean().default(true),
  no_port_forwarding: z.boolean().default(true),
  no_agent_forwarding: z.boolean().default(true),
  no_x11_forwarding: z.boolean().default(true),
  restricted_shell: z.boolean().default(false),
});

type AddKeyForm = z.infer<typeof addKeySchema>;
type DeployForm = z.infer<typeof deploySchema>;

export default function BastionKeysPage() {
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("setup");

  // Deploy wizard state
  const [deployTarget, setDeployTarget] = useState<SSHKey | null>(null);
  const [deployWizardStep, setDeployWizardStep] = useState('target');

  // Deployments tracking
  const [allDeployments, setAllDeployments] = useState<Record<number, KeyDeployment[]>>({});
  const [showDeploymentsForKey, setShowDeploymentsForKey] = useState<number | null>(null);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [retrying, setRetrying] = useState<number | null>(null);


  const fetchDeployments = async (keyId: number) => {
    try {
      const res = await fetch(`/api/bastion/keys/${keyId}/deployments`);
      const data = await res.json();
      if (!data.error) {
        setAllDeployments(prev => ({ ...prev, [keyId]: data.deployments }));
      }
    } catch { /* silent */ }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, sysRes] = await Promise.all([
        fetch('/api/bastion/keys'),
        fetch('/api/bastion/systems'),
      ]);
      const keysData = await keysRes.json();
      const sysData = await sysRes.json();
      if (!keysData.error) setKeys(keysData.keys);
      if (!sysData.error) setSystems(sysData.systems);
    } catch { toast.error('Failed to load keys'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWizardSubmit = async (data: AddKeyForm) => {
    try {
      if (data.mode === 'import' && !data.public_key) {
        toast.error("Public key is required for import mode");
        return;
      }

      const payload = {
        name: data.name,
        user_id: data.user_id,
        public_key: data.mode === 'import' ? data.public_key : ''
      };

      const res = await fetch('/api/bastion/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const responseData = await res.json();
      if (!responseData.error) {
        toast.success(payload.public_key ? 'Key imported successfully' : 'Keypair generated successfully');
        if (responseData.private_key) {
          const blob = new Blob([responseData.private_key], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${payload.name}.pem`;
          a.click();
          URL.revokeObjectURL(url);
          toast.info('Private key downloaded — store it safely!');

          if (data.install_local) {
            try {
              const installRes = await fetch('/api/bastion/keys/install-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_name: data.name, private_key: responseData.private_key })
              });
              const installData = await installRes.json();
              if (!installData.error) {
                toast.success(
                  installData.agent_added
                    ? `Key installed at ${installData.key_path} and added to ssh-agent ✓`
                    : `Key installed at ${installData.key_path}. Run \`ssh-add ${installData.key_path}\` to activate it.`,
                  { duration: 8000 }
                );
              } else {
                toast.warning(`Could not auto-install key: ${installData.message}`);
              }
            } catch {
              toast.warning('Auto-install request failed — use the downloaded .pem file manually.');
            }
          }
        }
        setIsWizardOpen(false);
        fetchData();
      } else {
        toast.error(responseData.message || 'Failed to add key');
      }
    } catch { toast.error('Network error'); }
  };

  const handleDeploy = async (data: DeployForm) => {
    if (!deployTarget) return;
    try {
      const res = await fetch(`/api/bastion/keys/${deployTarget.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: parseInt(data.system_id),
          linux_username: data.linux_username || undefined,
          privilege_level: data.privilege_level,
          is_system_managed: data.is_system_managed,
          restrictions: {
            no_port_forwarding: data.no_port_forwarding,
            no_agent_forwarding: data.no_agent_forwarding,
            no_x11_forwarding: data.no_x11_forwarding,
            restricted_shell: data.restricted_shell,
          }
        })
      });
      const result = await res.json();
      if (!result.error) {
        toast.success(result.message);
        const targetId = deployTarget.id;
        setDeployTarget(null);
        setDeployWizardStep('target');
        fetchDeployments(targetId);
      } else {
        toast.error(result.message);
      }
    } catch { toast.error('Network error'); }
  };

  const handleRetry = async (keyId: number, deploymentId: number) => {
    setRetrying(deploymentId);
    try {
      const res = await fetch(`/api/bastion/keys/${keyId}/deploy/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployment_id: deploymentId })
      });
      const data = await res.json();
      if (!data.error) {
        toast.success('Retry started in background.');
        fetchDeployments(keyId);
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Retry request failed'); }
    finally { setRetrying(null); }
  };

  const handleRevoke = async (keyId: number, deploymentId: number) => {

    try {
      const res = await fetch(`/api/bastion/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployment_id: deploymentId })
      });
      const data = await res.json();
      if (!data.error) {
        toast.success(data.message);
        fetchDeployments(keyId);
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Revocation failed'); }
  };

  const handleRotateServiceKey = async () => {
    setIsRotateDialogOpen(false);
    setLoading(true);
    try {
      const res = await fetch('/api/bastion/keys/rotate', { method: 'POST' });
      const data = await res.json();
      if (!data.error) {
        toast.success("Service Identity Key rotated and re-provisioning started!");
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Failed to rotate key'); }
    finally { setLoading(false); }
  };

  const handleDeleteKey = async (key: SSHKey) => {
    if (!confirm(`Are you sure you want to permanently strip '${key.name}' from all deployed systems? This is irreversible.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bastion/keys?id=${key.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        toast.success(data.message);
        if (data.unreachable_nodes && data.unreachable_nodes.length > 0) {
          toast.warning(`Note: The following nodes were offline during the sweep: ${data.unreachable_nodes.join(', ')}`);
        }
      } else {
        toast.error(data.message);
      }
      fetchData();
    } catch { toast.error('Network error during deletion'); }
    finally { setLoading(false); }
  };

  const filteredKeys = keys.filter(k =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'Key Identity',
      accessor: 'name',
      cell: (row: SSHKey) => {
        const isPlatformKey = row.user_id === 'bastion-service';
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPlatformKey ? 'bg-primary/10' : 'bg-muted'}`}>
              <Key size={16} className={row.is_active ? (isPlatformKey ? 'text-primary' : 'text-foreground') : 'text-muted-foreground'} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground leading-none mb-1">{row.name}</span>
                {isPlatformKey && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest bg-primary/10 text-primary border border-primary/20 uppercase">
                    Platform
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                {row.public_key?.substring(0, 44)}...
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Owner',
      accessor: 'user_id',
      cell: (row: SSHKey) => (
        <span className="text-sm font-medium text-muted-foreground">
          {row.user_id === 'bastion-service' ? 'Auto-managed' : row.user_id}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row: SSHKey) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest ${row.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
          {row.is_active ? '● ACTIVE' : '○ REVOKED'}
        </span>
      )
    }
  ];

  const tableData = filteredKeys.map(k => ({
    ...k,
    showEdit: false,
    showDelete: k.user_id !== 'bastion-service',
    showViewDetails: false
  }));

  const metrics = useMemo(() => [
    { title: "Vaulted Keys", count: keys.length, icon: <KeyRound />, color: "bg-blue-500" },
    { title: "Active Keys", count: keys.filter(k => k.is_active).length, icon: <ShieldCheck />, color: "bg-emerald-500" },
    { title: "Platform Managed", count: keys.filter(k => k.user_id === 'bastion-service').length, icon: <Globe />, color: "bg-primary" },
  ], [keys]);

  const steps = [
    {
      id: "setup",
      label: "Key Security",
      description: "Identity & Method",
      longDescription: "Personalize your security credentials. You can generate a fresh RSA keypair or bring your own public key to the Bastion ecosystem.",
      component: ({ watch, control, setValue, isSubmitting }: any) => {
        const currentMode = watch("mode");
        return (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="max-w-xs">
              <Tabs
                variant="pill"
                activeTab={currentMode}
                onChange={(id) => {
                  setValue("mode", id as any);
                  if (id === 'generate') setValue("public_key", "");
                }}
                tabs={[
                  { id: 'generate', label: 'Generate Key' },
                  { id: 'import', label: 'Import Existing' }
                ]}
              />
            </div>

            {/* Information Card */}
            {currentMode === "generate" && (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-4 items-start">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <Shield size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Immediate Provisioning</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The Bastion will generate a secure <span className="font-mono font-bold text-foreground">RSA 2048</span> keypair.
                    The private key will <span className="text-primary font-bold italic">automatically download</span> to your computer.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credential Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={currentMode === "generate" ? "e.g. Production Vault" : "e.g. Workstation Public"}
                        {...field}
                        className="h-10 border-border/60"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {currentMode === "generate" && (
                <FormField
                  control={control}
                  name="install_local"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Local Environment</FormLabel>
                      <FormControl>
                        <div
                          onClick={() => field.onChange(!field.value)}
                          className="flex items-center gap-3 py-2 cursor-pointer select-none group"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            field.value ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                          )}>
                            {field.value && <div className="w-1 h-2 border-r-2 border-b-2 border-primary-foreground rotate-45 mb-0.5" />}
                          </div>
                          <div className="flex-1 space-y-0">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <HardDrive size={14} className="text-muted-foreground" />
                              Auto-Install
                            </p>
                            <p className="text-[10px] text-muted-foreground opacity-60">Adds to ~/.ssh/Config</p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {currentMode === "import" && (
              <>
                <FormField
                  control={control}
                  name="public_key"
                  render={({ field }) => (
                    <FormItem className="space-y-2 max-w-2xl">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Public Key Payload</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ssh-rsa AAAAB3..."
                          className="font-mono text-xs h-32 resize-none border-border/60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Instructions */}
                <div className="p-3 bg-muted/40 border border-border/60 rounded-lg space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground font-semibold uppercase tracking-tight">
                    <Terminal size={12} /> Instructions
                  </div>
                  <p>
                    1. Generate a new keypair locally using: <code className="bg-background px-1.5 py-0.5 rounded border border-border/40 font-mono text-[10px]">ssh-keygen -t ed25519 -f ~/.ssh/[key-name]</code>
                  </p>
                  <p>
                    2. <strong className="text-foreground">Set Permissions</strong>: Secure your private key with <code className="bg-background px-1.5 py-0.5 rounded border border-border/40 font-mono text-[10px]">chmod 600 ~/.ssh/[key-name]</code>
                  </p>
                  <p>
                    3. Locate the <strong className="text-primary font-bold">Public Key</strong> file (usually <code className="bg-background px-1 font-mono">~/.ssh/[key-name].pub</code>).
                    <span className="italic"> Do not paste the private key.</span>
                  </p>
                  <p>
                    4. Copy the entire contents of the <code className="font-mono">.pub</code> file and paste it below. It should start with <code className="font-mono">ssh-ed25519</code> or <code className="font-mono">ssh-rsa</code>.
                  </p>
                  <p>
                    5. <strong className="text-foreground">To connect</strong>: Run <code className="bg-background px-1.5 py-0.5 rounded border border-border/40 font-mono text-[10px]">ssh-add ~/.ssh/[key-name]</code> on your machine, or use <code className="bg-background px-1.5 py-0.5 rounded border border-border/40 font-mono text-[10px]">ssh -i ~/.ssh/[key-name]</code> when connecting.
                  </p>
                </div>
              </>
            )}

            <FormField control={control} name="user_id" render={({ field }) => <input type="hidden" {...field} />} />
            <FormField control={control} name="mode" render={({ field }) => <input type="hidden" {...field} />} />
          </div>
        );
      }
    }
  ];

  return (
    <PageLayout
      title="SSH Keys"
      subtitle="Manage, distribute and revoke SSH access keys across your secure network."
      icon={Key}
      actions={
        <Button onClick={() => setIsWizardOpen(true)} variant="gradient" className="h-9">
          <Plus size={16} className="mr-2" /> New Access Key
        </Button>
      }
    >
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-0 flex-none">
          {metrics.map((m, i) => (
            <ResourceCard key={i} {...m} isLoading={loading} />
          ))}
        </div>

        {/* Keys List */}
        <div className="flex-1 min-h-0 bg-transparent flex flex-col overflow-hidden">
          <ResourceTable
            loading={loading}
            title="Credential Vault"
            description="Active SSH keys currently managed by the Bastion subsystem."
            icon={<Lock size={18} />}
            columns={columns}
            data={tableData}
            tableClassName="max-h-[calc(100vh-420px)] overflow-auto scrollbar-hide"
            extraHeaderContent={
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  type="text"
                  placeholder="Search vault..."
                  className="h-9 pl-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            }
            onDelete={(row) => row.user_id !== 'bastion-service' && handleDeleteKey(row)}
            customActions={[
              {
                label: "Deploy Key",
                icon: Send,
                onClick: (row) => setDeployTarget(row),
                show: (row) => row.is_active && row.user_id !== 'bastion-service'
              },
              {
                label: "Manage Deployments",
                icon: Globe,
                onClick: (row) => {
                  setShowDeploymentsForKey(row.id);
                  fetchDeployments(row.id);
                },
                show: (row) => row.user_id !== 'bastion-service'
              },
              {
                label: "Rotate Key",
                icon: RotateCcw,
                onClick: () => setIsRotateDialogOpen(true),
                show: (row) => row.user_id === 'bastion-service'
              }
            ]}
          />
        </div>
      </div>

      <FormWizard
        name="add-key-standard-wizard"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        initialValues={{ name: '', user_id: 'admin', mode: 'generate', public_key: '', install_local: false }}
        schema={addKeySchema}
        onSubmit={handleWizardSubmit}
        submitLabel="Provision Key"
        submitIcon={Download}
        heading={{
          primary: "Access Provisioning",
          secondary: "Generate or import secure keys for distribution to target infrastructure.",
          icon: Key
        }}
        steps={steps}
      />

      {/* Deploy Wizard */}
      <FormWizard<DeployForm>
        name="deploy-identity-wizard"
        isWizardOpen={!!deployTarget}
        setIsWizardOpen={(open) => { if (!open) { setDeployTarget(null); setDeployWizardStep('target'); } }}
        currentStep={deployWizardStep}
        setCurrentStep={setDeployWizardStep}
        initialValues={{
          system_id: '',
          linux_username: '',
          privilege_level: 'user',
          is_system_managed: true,
          no_port_forwarding: true,
          no_agent_forwarding: true,
          no_x11_forwarding: true,
          restricted_shell: false,
        }}
        schema={deploySchema}
        onSubmit={handleDeploy}
        submitLabel="Deploy Identity"
        submitIcon={Send}
        heading={{
          primary: 'Onboard Guest Identity',
          secondary: deployTarget ? `Deploying credentials for "${deployTarget.name}"` : 'Configure deployment parameters',
          icon: Fingerprint,
        }}
        steps={[
          {
            id: 'target',
            label: 'Target System',
            description: 'Select destination host',
            icon: Server,
            longDescription: 'Choose the infrastructure system this identity will be deployed to and optionally override the Linux username.',
            canNavigateNext: (form) => {
              const v = form.getValues('system_id');
              return v ? { can: true } : { can: false, message: 'Please select a target system.' };
            },
            component: ({ control, watch, setValue }: any) => (
              <div className="space-y-6">
                <FormField
                  control={control}
                  name="system_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Infrastructure</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 border-border/60">
                            <SelectValue placeholder="Select a system..." />
                          </SelectTrigger>
                          <SelectContent>
                            {systems.map(s => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                <div className="flex items-center gap-2">
                                  <Server size={14} className="text-muted-foreground" />
                                  <span>{s.name}</span>
                                  <span className="font-mono text-xs text-muted-foreground">({s.ip_address})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="linux_username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linux Username Override</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={deployTarget?.name.toLowerCase().replace(/ /g, '_') || 'auto'}
                          {...field}
                          className="h-11 font-mono border-border/60"
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">Leave empty to use the identity name as the Linux username.</p>
                    </FormItem>
                  )}
                />
              </div>
            )
          },
          {
            id: 'privilege',
            label: 'Privileges',
            description: 'Access level & restrictions',
            icon: UserCog,
            longDescription: 'Configure the privilege level and SSH security hardening for this identity on the target system.',
            component: ({ control, watch, setValue }: any) => {
              const privilegeLevel = watch('privilege_level');
              return (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privilege Level</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'user', label: 'Guest', desc: 'Standard access, no sudo', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500' },
                        { id: 'sudo', label: 'Sudoer', desc: 'Managed sudo group', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500' },
                        { id: 'root', label: 'Root', desc: 'Full UID 0 access', icon: Zap, color: 'text-primary', bg: 'bg-primary/10 border-primary' },
                      ].map(p => (
                        <div
                          key={p.id}
                          onClick={() => setValue('privilege_level', p.id as any)}
                          className={cn(
                            'cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2',
                            privilegeLevel === p.id ? p.bg : 'bg-muted/30 border-border/50 hover:border-border text-muted-foreground'
                          )}
                        >
                          <p.icon size={20} className={privilegeLevel === p.id ? p.color : ''} />
                          <div>
                            <p className="text-sm font-bold">{p.label}</p>
                            <p className="text-[10px] opacity-70 leading-tight">{p.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SSH Hardening</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: 'no_port_forwarding', label: 'Block Tunneling', desc: 'no-port-forwarding' },
                        { name: 'no_agent_forwarding', label: 'Block Agent Leak', desc: 'no-agent-forwarding' },
                        { name: 'no_x11_forwarding', label: 'Block X11', desc: 'no-x11-forwarding' },
                        { name: 'restricted_shell', label: 'Restricted Shell', desc: 'Forces /bin/rbash' },
                      ].map(opt => (
                        <FormField
                          key={opt.name}
                          control={control}
                          name={opt.name as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div
                                  onClick={() => field.onChange(!field.value)}
                                  className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                                    field.value ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/40 hover:border-border'
                                  )}
                                >
                                  <div className={cn(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                    field.value ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                                  )}>
                                    {field.value && <CheckCircle2 size={10} className="text-primary-foreground" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold">{opt.label}</p>
                                    <p className="text-[9px] font-mono text-muted-foreground">{opt.desc}</p>
                                  </div>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={control}
                    name="is_system_managed"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                              field.value ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/40 hover:border-border'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                              field.value ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                            )}>
                              {field.value && <CheckCircle2 size={12} className="text-primary-foreground" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">Managed Account</p>
                              <p className="text-[11px] text-muted-foreground">Bastion will create and delete the Linux user account on deploy/revoke.</p>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            }
          }
        ]}
      />

      {/* Deployments Status Modal */}
      <Dialog open={!!showDeploymentsForKey} onOpenChange={() => setShowDeploymentsForKey(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Activity size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">Deployment Status</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Identity: <span className="font-semibold text-foreground">{keys.find(k => k.id === showDeploymentsForKey)?.name}</span>
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => showDeploymentsForKey && fetchDeployments(showDeploymentsForKey)}
              >
                <RefreshCw size={12} className="mr-1.5" /> Refresh
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {(allDeployments[showDeploymentsForKey!] || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Globe size={40} className="opacity-10 mb-3" />
                <p className="text-sm">No active deployments for this identity.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(allDeployments[showDeploymentsForKey!] || []).map((d) => {
                  const isFailed = d.status === 'failed' || d.status === 'revoke_failed';
                  const isActive = d.status === 'active';
                  const isInProgress = d.status === 'pending' || d.status === 'revoking';

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'rounded-xl border p-4 space-y-3 transition-all',
                        isFailed ? 'border-destructive/30 bg-destructive/5' :
                        isActive ? 'border-emerald-500/20 bg-emerald-500/5' :
                        'border-border/50 bg-muted/10'
                      )}
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg shrink-0',
                            isFailed ? 'bg-destructive/10 text-destructive' :
                            isActive ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-muted text-muted-foreground'
                          )}>
                            <Server size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-none mb-1">{d.system_name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{d.system_ip}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isInProgress && <Loader2 size={12} className="animate-spin text-primary" />}
                          {isActive && <CheckCircle2 size={12} className="text-emerald-500" />}
                          {isFailed && <AlertCircle size={12} className="text-destructive" />}
                          <span className={cn(
                            'text-[10px] uppercase font-bold tracking-widest',
                            isActive ? 'text-emerald-500' :
                            isFailed ? 'text-destructive' : 'text-primary'
                          )}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserCog size={10} />
                          <code className="font-mono font-semibold text-foreground">{d.linux_username}</code>
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded border capitalize text-[9px] font-bold',
                          d.privilege_level === 'user' ? 'bg-muted border-border text-muted-foreground' :
                          d.privilege_level === 'sudo' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                          'bg-primary/10 border-primary/30 text-primary'
                        )}>
                          {d.privilege_level}
                        </span>
                        {d.is_system_managed && (
                          <span className="px-2 py-0.5 rounded border bg-muted/50 border-border/60 text-[9px]">Managed</span>
                        )}
                      </div>

                      {/* Inline Error */}
                      {isFailed && d.last_error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1.5">
                          <p className="text-[10px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle size={10} /> Failure Reason
                          </p>
                          <pre className="text-[11px] font-mono text-destructive/90 leading-relaxed whitespace-pre-wrap break-all">
                            {d.last_error}
                          </pre>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30">
                        {isFailed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] border-primary/30 text-primary hover:bg-primary/10"
                            disabled={retrying === d.id}
                            onClick={() => handleRetry(showDeploymentsForKey!, d.id)}
                          >
                            {retrying === d.id
                              ? <Loader2 size={12} className="animate-spin mr-1.5" />
                              : <RefreshCw size={12} className="mr-1.5" />
                            }
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevoke(showDeploymentsForKey!, d.id)}
                        >
                          <Trash2 size={12} className="mr-1.5" /> Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              Rotate Service Identity Key?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm">
              <p>
                This is a <span className="font-bold text-foreground">critical security action</span>. 
                Rotating the key will generate a new identity for this Bastion instance.
              </p>
              <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-2">
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  1-Click Automation:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[10px] text-muted-foreground">
                  <li>Existing systems will be <span className="font-bold text-foreground">automatically re-provisioned</span> in the background.</li>
                  <li>Uses current managed key and stored passwords for seamless transition.</li>
                  <li>Old audit trail remains safe; old private key is wiped after sweep.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-foreground border-none h-10 px-6">
              Keep Existing Key
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRotateServiceKey}
              className="bg-amber-600 hover:bg-amber-700 text-white h-10 px-6 font-bold"
            >
              Rotate & Sync All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

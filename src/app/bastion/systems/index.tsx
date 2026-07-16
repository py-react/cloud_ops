import React, { useState, useEffect, useMemo } from 'react';
import {
  Server, Plus, Search, Terminal as TerminalIcon,
  ShieldCheck, ShieldAlert, RefreshCw, Monitor,
  Activity, Shield, Lock, Upload, X, FileCode
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useTerminal } from "@/components/bastion/TerminalContext";
import useNavigate from "@/libs/navigate";
import PageLayout from "@/components/PageLayout";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import FormWizard from "@/components/wizard/form-wizard";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DefaultService } from "@/gingerJs_api_client";

const PEMUploadField = ({
  value,
  onChange,
}: {
  value?: string,
  onChange: (val: string) => void,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      onChange(content)
      toast.success("PEM key loaded from file")
    }
    reader.readAsText(file)
  }

  return (
    <div className="relative group">
      {value ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-xs font-mono">
          <div className="flex items-center gap-2 truncate text-blue-700">
            <FileCode className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-bold">Identity Key Loaded</span>
              <span className="text-[10px] opacity-70">RSA/ED25519 Private Key</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept=".pem,.key"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border border-dashed border-border/60 bg-muted/5 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200">
            <div className="p-3 rounded-full bg-background border border-border/50 group-hover:scale-110 transition-transform duration-200">
              <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Click to upload .pem key</p>
              <p className="text-[10px] text-muted-foreground italic">Drag and drop also supported</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface System {
  id: number;
  name: string;
  ip_address: string;
  username?: string;
  status?: string;
  provider?: string;
  service_key_deployed?: boolean;
  private_key?: string;
  connection_type?: 'ssh' | 'rdp';
  os_type?: string;
}

const systemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ip_address: z.string().min(1, "IP address is required"),
  username: z.string().min(1, "Username is required"),
  connection_type: z.enum(['ssh', 'rdp']).default('ssh'),
  connection_port: z.coerce.number().int().min(1).max(65535).optional(),
  password: z.string().optional(),
  private_key: z.string().optional(),
}).refine(data => data.password || data.private_key, {
  message: "Either password or private key is required",
  path: ["password"],
});

type SystemFormValues = z.infer<typeof systemSchema>;

export default function BastionSystemsPage() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);
  const [currentStep, setCurrentStep] = useState('details');
  const [authType, setAuthType] = useState('managed');
  const [connectionType, setConnectionType] = useState<'ssh' | 'rdp'>('ssh');
  const { addSession } = useTerminal();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data: any = await DefaultService.apiBastionSystemsGet();
      if (!data.error) setSystems(data.systems);
    } catch { toast.error('Failed to load systems'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSystem = async (values: SystemFormValues) => {
    try {
      const data: any = await DefaultService.apiBastionSystemsPost({
        requestBody: {
          ...values,
          hostname: values.ip_address,
          connection_type: values.connection_type || 'ssh',
          connection_port: values.connection_port || (values.connection_type === 'rdp' ? 3389 : 22)
        }
      });
      if (!data.error) {
        toast.success(
          data.provisioning
            ? `${values.name} registered — installing service key in background...`
            : `${values.name} registered successfully`
        );
        setIsWizardOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to add system');
      }
    } catch { toast.error('Network error'); }
  };



  const handleDelete = async () => {
    if (!systemToDelete) return;
    try {
      const data: any = await DefaultService.apiBastionSystemsSystemIdDelete({ systemId: systemToDelete.id });
      if (!data.error) {
        toast.success(data.message);
        setSystems(prev => prev.filter(s => s.id !== systemToDelete.id));
        setSystemToDelete(null);
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Failed to archive system'); }
  };

  const handleToggleStatus = async (system: System, newStatus: string) => {
    try {
      const res = await fetch(`/api/bastion/systems/${system.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.error) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const filteredSystems = systems.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ip_address.includes(searchQuery)
  );

  const columns = [
    {
      header: 'System Name',
      accessor: 'name',
      cell: (row: System) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {row.connection_type === 'rdp' ? <Monitor size={18} /> : <Server size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none mb-1">{row.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{row.ip_address}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Protocol',
      accessor: 'connection_type',
      cell: (row: System) => (
        <Badge 
          variant={row.connection_type === 'rdp' ? 'default' : 'secondary'}
          className={cn(
            "capitalize text-[10px] px-2 py-0.5",
            row.connection_type === 'rdp' && "bg-green-500/10 text-green-500 border-green-500/20",
            (!row.connection_type || row.connection_type === 'ssh') && "bg-blue-500/10 text-blue-500 border-blue-500/20"
          )}
        >
          {row.connection_type === 'rdp' ? 'RDP' : 'SSH'}
        </Badge>
      )
    },
    { header: 'SSH User', accessor: 'username' },
    { header: 'Provider', accessor: 'provider' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row: System) => {
        let variant: 'success' | 'warning' | 'destructive' | 'default' = 'default';
        let label = row.status || 'Active';
        
        if (row.status === 'active') variant = 'success';
        else if (row.status === 'inactive') variant = 'warning';
        else if (row.status === 'reprovisioning') variant = 'warning';
        
        return (
          <Badge 
            variant={variant} 
            className={cn(
              "capitalize text-[10px] px-2 py-0.5",
              row.status === 'reprovisioning' && "animate-pulse"
            )}
          >
            {label}
          </Badge>
        );
      }
    },
    {
      header: 'Security Status',
      accessor: 'security_status',
      cell: (row: System) => {
        if (row.connection_type === 'rdp') {
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit">
              <Monitor size={12} className="text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">RDP Auth</span>
            </div>
          );
        }
        if (row.private_key) {
          return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
              <ShieldCheck size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Direct Key Auth</span>
            </div>
          );
        }
        return row.service_key_deployed ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Managed Key Deployed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit">
            <ShieldAlert size={12} className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Password Auth</span>
          </div>
        );
      }
    }
  ];

  const tableData = filteredSystems.map(s => ({
    ...s,
    provider: s.provider || 'Self-hosted',
    showEdit: false,
    showDelete: true,
    showPlay: s.status === 'inactive',
    showPause: s.status !== 'inactive'
  }));

  const metrics = useMemo(() => [
    { title: "Total Systems", count: systems.length, icon: <Monitor />, color: "bg-blue-500" },
    { title: "SSH Systems", count: systems.filter(s => !s.connection_type || s.connection_type === 'ssh').length, icon: <TerminalIcon />, color: "bg-blue-500" },
    { title: "RDP Systems", count: systems.filter(s => s.connection_type === 'rdp').length, icon: <Monitor />, color: "bg-green-500" },
  ], [systems]);

  const steps = [
    {
      id: 'details',
      label: 'Node Identity',
      description: 'Credentials & Network',
      longDescription: 'Establish a secure connection link to your target infrastructure. You can either let the Bastion manage the keys or provide your own identity key.',
      component: ({ control, setValue }: { control: any, setValue: any }) => {
        return (
          <div className="space-y-6 py-4 max-w-2xl">
            {/* Info Card */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex gap-4 items-start text-xs text-muted-foreground leading-relaxed">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Secure Onboarding</p>
                <p>
                  Choose between <span className="font-bold text-primary">Managed Identity</span> (password bootstrap) or <span className="font-bold text-primary">Direct Identity</span> (user PEM key).
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Edge-Router-Dallas" {...field} className="h-10 border-border/60" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="ip_address"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP / Hostname</FormLabel>
                      <FormControl>
                        <Input placeholder="10.0.0.42" {...field} className="h-10 border-border/60 font-mono text-xs" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</FormLabel>
                      <FormControl>
                        <Input placeholder={connectionType === 'rdp' ? 'Administrator' : 'root'} {...field} className="h-10 border-border/60" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection Protocol</Label>
                <Tabs 
                  variant="pill"
                  activeTab={connectionType}
                  onChange={(id) => {
                    setConnectionType(id as 'ssh' | 'rdp');
                    setValue('connection_type', id);
                    setValue('connection_port', id === 'rdp' ? 3389 : 22);
                  }}
                  tabs={[
                    { id: 'ssh', label: 'SSH' },
                    { id: 'rdp', label: 'RDP' },
                  ]}
                  className="w-fit"
                />

                <FormField
                  control={control}
                  name="connection_port"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection Port</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={connectionType === 'rdp' ? '3389' : '22'} 
                          {...field} 
                          className="h-10 border-border/60 font-mono text-xs w-32" 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authentication Method</Label>
                </div>
                
                <Tabs 
                  variant="pill"
                  activeTab={authType}
                  onChange={(id) => {
                    setAuthType(id);
                    if (id === 'managed') setValue('private_key', '');
                    else setValue('password', '');
                  }}
                  tabs={[
                    { id: 'managed', label: 'Managed Bastion Key' },
                    { id: 'provided', label: 'User PEM Key' },
                  ]}
                  className="w-fit"
                />

                {authType === 'managed' ? (
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installation Secret</FormLabel>
                          <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <Lock size={8} /> Never Stored
                          </span>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="Sudo-enabled password" {...field} className="h-10 border-border/60" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                        <div className="flex items-center gap-2 py-1 px-1">
                          <Shield size={10} className="text-muted-foreground/60" />
                          <p className="text-[9px] text-muted-foreground leading-tight italic">
                            The Bastion uses this secret once to plant its SSH key, then ignores future password attempts.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={control}
                    name="private_key"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Private Key (PEM)</FormLabel>
                          <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <Lock size={8} /> Encrypted At Rest
                          </span>
                        </div>
                        <FormControl>
                          <PEMUploadField 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                        <div className="flex items-center gap-2 py-1 px-1">
                          <Shield size={10} className="text-muted-foreground/60" />
                          <p className="text-[9px] text-muted-foreground leading-tight italic">
                            This key will be stored securely and used directly for all SSH sessions. The Bastion will not manage identity for this node.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <PageLayout
      title="Target Systems"
      subtitle="Manage and connect to your infrastructure. Supported methods: Managed Bastion Keys or User-Provided PEM Keys."
      icon={Server}
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw size={16} />
          </Button>
          <Button onClick={() => {
            setIsWizardOpen(true);
            setAuthType('managed');
            setConnectionType('ssh');
          }} variant="gradient" className="h-9">
            <Plus size={16} className="mr-2" /> Add System
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-0 flex-none">
          {metrics.map((m, i) => (
            <ResourceCard key={i} {...m} isLoading={loading} />
          ))}
        </div>

        {/* Systems List */}
        <div className="flex-1 min-h-0 bg-transparent flex flex-col overflow-hidden">
          <ResourceTable
            loading={loading}
            title="Infrastructure Inventory"
            description="Manage your SSH targets and active connections."
            icon={<Monitor size={18} />}
            columns={columns}
            data={tableData}
            tableClassName="max-h-[calc(100vh-420px)] overflow-auto scrollbar-hide"
            extraHeaderContent={
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  type="text"
                  placeholder="Filter inventory..."
                  className="h-9 pl-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            }
            onDelete={(row) => setSystemToDelete(row)}
            onPlay={(row) => handleToggleStatus(row, 'active')}
            onPause={(row) => handleToggleStatus(row, 'inactive')}
            customActions={[
              {
                label: "Connect SSH",
                icon: TerminalIcon,
                onClick: (row) => {
                  addSession({ systemId: row.id, systemName: row.name, connectionType: 'ssh' });
                  navigate(`/bastion/console`);
                },
                show: (row) => (row.status === 'active' || !row.status) && row.connection_type !== 'rdp'
              },
              {
                label: "Connect RDP",
                icon: Monitor,
                onClick: (row) => {
                  addSession({ systemId: row.id, systemName: row.name, connectionType: 'rdp' });
                  navigate(`/bastion/console`);
                },
                show: (row) => (row.status === 'active' || !row.status) && row.connection_type === 'rdp'
              }
            ]}
          />
        </div>
      </div>

      <FormWizard
        name="add-system-wizard"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        initialValues={{ name: '', ip_address: '', username: 'root', connection_type: 'ssh', connection_port: 22, password: '', private_key: '' }}
        schema={systemSchema}
        onSubmit={handleCreateSystem}
        submitLabel="Register System"
        submitIcon={Server}
        heading={{
          primary: "Register Target System",
          secondary: "Securely onboard a new node using either password bootstrap or your own PEM key.",
          icon: Server
        }}
        steps={steps}
      />

      <AlertDialog open={!!systemToDelete} onOpenChange={(open) => !open && setSystemToDelete(null)}>
        <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Archive System?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm">
              <p>
                You are about to archive <span className="font-bold text-foreground underline underline-offset-2 decoration-destructive/30">"{systemToDelete?.name}"</span>.
              </p>
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-1 p-0.5 bg-emerald-500/10 rounded-full">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Historical audit logs will be <span className="font-bold text-foreground">permanently preserved</span> for compliance.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 p-0.5 bg-amber-500/10 rounded-full">
                    <X className="h-3 w-3 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    The system will be hidden from the active inventory list.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-foreground border-none h-10 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 px-6 font-bold"
            >
              Archive System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

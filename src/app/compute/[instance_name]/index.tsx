import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Network, Shield, Calendar, Layers, Terminal, AlertCircle, Play, Square, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';

interface InstanceDetails {
    id: number | null;
    instance_name: string;
    zone: string;
    machine_type: string;
    boot_disk_size_gb: number;
    gcp_resource_id: string;
    status: string;
    external_ip: string;
    creation_timestamp: string;
    description: string;
}

interface PageProps {
    instance?: InstanceDetails;
    error?: string;
}

export default function ComputeInstanceDetails({ instance: initialInstance }: PageProps) {
    const { selectedGcpCredential } = useGCP();
    const [instance, setInstance] = useState<InstanceDetails | undefined>(initialInstance);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const refreshInstanceData = async () => {
        if (!instance) return;
        setRefreshing(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential?.id;
        const projectId = selectedGcpCredential?.project_id;
        try {
            const url = `/api/v1/gcp/compute/instances/${instance.instance_name}?project_id=${projectId}&zone=${instance.zone}&credential_id=${credId}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                toast.error(data.message || 'Failed to refresh instance details');
            } else {
                setInstance({
                    id: data.id,
                    instance_name: data.instance_name,
                    zone: data.zone,
                    machine_type: data.machine_type,
                    boot_disk_size_gb: data.boot_disk_size_gb,
                    gcp_resource_id: data.gcp_resource_id,
                    status: data.status,
                    external_ip: data.external_ip || 'N/A',
                    creation_timestamp: data.creation_timestamp,
                    description: data.description || 'No description.'
                });
            }
        } catch {
            toast.error('Failed to sync live state');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAction = async (action: 'start' | 'stop' | 'delete') => {
        if (!instance) return;
        setActionLoading(true);
        const token = getAuthToken();
        const credId = selectedGcpCredential?.id;
        const projectId = selectedGcpCredential?.project_id;
        try {
            const url = action === 'delete'
                ? `/api/v1/gcp/compute/instances/${instance.instance_name}?project_id=${projectId}&zone=${instance.zone}&credential_id=${credId}`
                : `/api/v1/gcp/compute/instances/${instance.instance_name}/${action}?project_id=${projectId}&zone=${instance.zone}&credential_id=${credId}`;
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                toast.error(data.message || `Failed to execute ${action}`);
            } else {
                toast.success(`VM ${action} operation initiated successfully`);
                if (action === 'delete') {
                    // Navigate back or show message
                    setTimeout(() => {
                        window.location.href = '/settings/gcp/compute';
                    }, 1500);
                } else {
                    refreshInstanceData();
                }
            }
        } catch {
            toast.error(`Error during VM ${action} operation`);
        } finally {
            setActionLoading(false);
        }
    };

    if (!instance) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
                <h1 className="text-xl font-extrabold tracking-tight uppercase">Instance details unavailable</h1>
                <p className="text-slate-400 text-xs mt-2 font-semibold">Make sure the instance exists in the database and active credentials are loaded.</p>
                <Button variant="outline" className="mt-6 border-slate-700 hover:bg-slate-800 text-white" onClick={() => window.location.href = '/settings/gcp/compute'}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Compute Engine
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => window.location.href = '/settings/gcp/compute'}
                        className="flex items-center text-xs font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to List
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">{instance.instance_name}</h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Zone: {instance.zone} • GCP Resource ID: {instance.gcp_resource_id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={refreshInstanceData}
                        disabled={refreshing}
                        className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 h-9 font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Sync State
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction('start')}
                        disabled={actionLoading || instance.status === 'RUNNING'}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9"
                    >
                        <Play className="w-4 h-4 mr-2" /> Start
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('stop')}
                        disabled={actionLoading || instance.status === 'TERMINATED'}
                        className="border-slate-800 hover:bg-slate-800 text-slate-300 font-bold h-9"
                    >
                        <Square className="w-4 h-4 mr-2" /> Stop
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction('delete')}
                        disabled={actionLoading}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-9"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </div>
            </div>

            {/* Grid of details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Live Status Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Layers className="w-16 h-16 text-indigo-400" />
                    </div>
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Live Status</span>
                        <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${instance.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                            <span className="text-2xl font-black text-white">{instance.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Real-time state hydration</p>
                    </div>
                </div>

                {/* External Network IP Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Network className="w-16 h-16 text-emerald-400" />
                    </div>
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">External Access</span>
                        <div className="text-xl font-bold text-white font-mono">{instance.external_ip || 'No Access Config'}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Access Config NAT IP</p>
                    </div>
                </div>

                {/* Configuration Specs Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Cpu className="w-16 h-16 text-amber-400" />
                    </div>
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">VM Profile</span>
                        <div className="text-lg font-black text-white">{instance.machine_type}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Immutable baseline config</p>
                    </div>
                </div>

                {/* Storage Allocation Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <HardDrive className="w-16 h-16 text-purple-400" />
                    </div>
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Storage</span>
                        <div className="text-2xl font-black text-white">{instance.boot_disk_size_gb} GB</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Boot Disk Allocation</p>
                    </div>
                </div>
            </div>

            {/* Bottom details pane */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Specs overview */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Infrastructure Baseline Details</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Constant specs persisted locally</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GCP Resource ID</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.gcp_resource_id}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Instance Name</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.instance_name}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Zone</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.zone}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Machine Type Profile</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.machine_type}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Boot Disk Space</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.boot_disk_size_gb} GB</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Provisioned At</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-1.5 rounded border border-slate-800 block">{instance.creation_timestamp || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info / Security Context */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">System Info</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Platform security & identity</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Ownership Status</span>
                                    <span className="text-xs font-bold text-white">Verified Local DB Tenant</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <Calendar className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Deployment Age</span>
                                    <span className="text-xs font-bold text-white">Provisioned on Google Cloud</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase">
                        GCP HYBRID DATA MODEL ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
}

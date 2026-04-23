import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Server, 
  Key, 
  Users, 
  Clock, 
  Plus, 
  LogOut, 
  Terminal as TerminalIcon,
  Search,
  MoreVertical,
  Loader2,
  Settings,
  X,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface System {
  id: number;
  name: string;
  ip_address: string;
  username?: string;
  password?: string;
  status?: string;
  provider?: string;
}

interface SSHKey {
  id: number;
  name: string;
  user_id: string;
  created_at?: string;
  is_active: boolean;
}

const BastionDashboard: React.FC<{ onConnect: (id: number, name: string, connectionType: 'ssh' | 'rdp') => void }> = ({ onConnect }) => {
  const [activeTab, setActiveTab] = useState<'systems' | 'keys' | 'access' | 'audit'>('systems');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [systems, setSystems] = useState<System[]>([]);
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newSystem, setNewSystem] = useState({ name: '', hostname: '', ip_address: '', username: '', password: '' });
  const [newKey, setNewKey] = useState({ name: '', user_id: 'admin', public_key: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [systemsRes, keysRes] = await Promise.all([
        fetch('/api/bastion/systems'),
        fetch('/api/bastion/keys')
      ]);
      
      const systemsData = await systemsRes.json();
      const keysData = await keysRes.json();
      
      if (!systemsData.error) setSystems(systemsData.systems);
      if (!keysData.error) setKeys(keysData.keys);
      
    } catch (error) {
      console.error('Failed to fetch bastion data:', error);
      toast.error('Failed to load live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSystem = async () => {
    try {
      const res = await fetch('/api/bastion/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSystem)
      });
      const data = await res.json();
      if (!data.error) {
        toast.success(`System ${newSystem.name} added successfully`);
        setIsSystemModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to add system');
      }
    } catch (error) {
      toast.error('Network error while adding system');
    }
  };

  const handleAddKey = async () => {
    try {
      const res = await fetch('/api/bastion/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      if (!data.error) {
        toast.success(`Key ${newKey.name} ${newKey.public_key ? 'imported' : 'generated'} successfully`);
        if (data.private_key) {
           // In a real app, prompt to download private key
           console.log("Private Key Generated:", data.private_key);
           toast.info("Private key generated. Check your downloads (simulated).");
        }
        setIsKeyModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to add key');
    }
  };

  const filteredSystems = systems.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.ip_address.includes(searchQuery)
  );

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    k.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-[#238636] p-2 rounded-lg">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Bastion</span>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'systems', icon: Server, label: 'Systems' },
            { id: 'keys', icon: Key, label: 'SSH Keys' },
            { id: 'access', icon: Users, label: 'Access Control' },
            { id: 'audit', icon: Clock, label: 'Audit Logs' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-[#1f6feb] text-white shadow-lg shadow-blue-500/20' 
                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#30363d] px-2">
          <div className="flex items-center gap-3 py-2 text-xs opacity-50">
             <Settings size={14} />
             <span>Bastion v1.0.42</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={16} />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-[#161b22] border border-[#30363d] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => fetchData()}
              className="p-2 text-[#8b949e] hover:text-white transition-colors"
              title="Sync Data"
             >
               {loading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
             </button>
             <Button 
                onClick={() => activeTab === 'systems' ? setIsSystemModalOpen(true) : setIsKeyModalOpen(true)}
                className="bg-[#238636] hover:bg-[#2ea043] text-white"
             >
               <Plus size={16} className="mr-2" />
               New {activeTab === 'systems' ? 'System' : 'Key'}
             </Button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0d1117]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <Loader2 size={48} className="animate-spin text-[#1f6feb] mb-4 opacity-50" />
              <p className="text-sm text-[#565f89]">Synchronizing with secure vaults...</p>
            </div>
          ) : (
            <>
              {activeTab === 'systems' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Target Systems</h2>
                      <p className="text-[#8b949e] text-sm">Manage and connect to your cloud infrastructure sessions.</p>
                    </div>
                  </div>

                  {filteredSystems.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-[#30363d] rounded-xl">
                      <Server size={48} className="mx-auto text-[#30363d] mb-4" />
                      <p className="text-[#8b949e]">No systems found. Add your first VM to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSystems.map((system) => (
                        <div key={system.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#444c56] transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-[#21262d] rounded-lg text-[#1f6feb]">
                              <Server size={24} />
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#21262d]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#238636] animate-pulse" />
                              <span className="text-[#3fb950]">Online</span>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-white mb-1">{system.name}</h3>
                          <p className="text-[#8b949e] text-xs mb-6 font-mono">{system.ip_address} • {system.provider || 'Internal'}</p>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => onConnect(system.id, system.name, 'ssh')}
                              className="flex-1 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <TerminalIcon size={16} />
                              SSH
                            </button>
                            <button 
                              onClick={() => onConnect(system.id, system.name, 'rdp')}
                              className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <Monitor size={16} />
                              RDP
                            </button>
                            <button className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors text-[#8b949e] hover:text-white">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'keys' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-1">SSH Key Management</h2>
                      <p className="text-[#8b949e] text-sm">Centralized control for distributed public keys across your systems.</p>
                    </div>

                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#010409] text-[#8b949e] border-b border-[#30363d]">
                          <tr>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Key Name</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#30363d]">
                          {filteredKeys.map((key) => (
                            <tr key={key.id} className="hover:bg-[#21262d]/50 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <Key size={18} className="text-[#1f6feb]" />
                                  <span className="font-semibold text-white">{key.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-[#8b949e]">{key.user_id}</td>
                              <td className="px-6 py-5">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${key.is_active ? 'bg-[#238636]/10 text-[#3fb950]' : 'bg-red-500/10 text-red-500'}`}>
                                  {key.is_active ? 'ACTIVE' : 'REVOKED'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button className="text-[#8b949e] hover:text-[#f85149] transition-colors font-medium">Revoke</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
              )}
            </>
          )}
          
          {['access', 'audit'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-[#565f89]">
               <Clock size={64} className="mb-4 opacity-10" />
               <p className="text-lg font-medium">Coming Soon</p>
               <p className="text-sm opacity-60">This module is currently being implemented.</p>
            </div>
          )}
        </main>
      </div>

      {/* Add System Modal */}
      <Dialog open={isSystemModalOpen} onOpenChange={setIsSystemModalOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-white">
          <DialogHeader>
            <DialogTitle>Add Target System</DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Enter the connection details for the remote VM or container.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newSystem.name} onChange={e => setNewSystem({...newSystem, name: e.target.value})} className="col-span-3 bg-[#0d1117] border-[#30363d]" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ip" className="text-right">IP Address</Label>
              <Input id="ip" value={newSystem.ip_address} onChange={e => setNewSystem({...newSystem, ip_address: e.target.value, hostname: e.target.value})} className="col-span-3 bg-[#0d1117] border-[#30363d]" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">User</Label>
              <Input id="user" placeholder="root" value={newSystem.username} onChange={e => setNewSystem({...newSystem, username: e.target.value})} className="col-span-3 bg-[#0d1117] border-[#30363d]" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pass" className="text-right">Password</Label>
              <Input id="pass" type="password" placeholder="Optional" value={newSystem.password} onChange={e => setNewSystem({...newSystem, password: e.target.value})} className="col-span-3 bg-[#0d1117] border-[#30363d]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSystem} className="bg-[#238636] hover:bg-[#2ea043]">Register System</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Key Modal */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-white">
          <DialogHeader>
            <DialogTitle>SSH Key Management</DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Upload a public key or generate a new key pair.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key-name" className="text-right">Name</Label>
              <Input id="key-name" value={newKey.name} onChange={e => setNewKey({...newKey, name: e.target.value})} className="col-span-3 bg-[#0d1117] border-[#30363d]" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pub-key" className="text-right">Public Key</Label>
              <textarea 
                id="pub-key" 
                placeholder="ssh-rsa ... (Leave empty to generate)" 
                className="col-span-3 bg-[#0d1117] border-[#30363d] rounded-md p-2 text-xs h-24 focus:ring-1 focus:ring-blue-500 outline-none"
                value={newKey.public_key}
                onChange={e => setNewKey({...newKey, public_key: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddKey} className="bg-[#1f6feb] hover:bg-[#388bfd]">
              {newKey.public_key ? 'Import Key' : 'Generate Key Pair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BastionDashboard;

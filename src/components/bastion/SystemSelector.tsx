import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Server, Search, Loader2, Terminal, Monitor } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface System {
  id: number;
  name: string;
  ip_address: string;
  provider?: string;
}

interface SystemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: number, name: string) => void;
}

const SystemSelector: React.FC<SystemSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchSystems = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/bastion/systems');
          const data = await res.json();
          if (!data.error) setSystems(data.systems);
        } catch (error) {
          console.error('Failed to fetch systems:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSystems();
    }
  }, [isOpen]);

  const filtered = systems.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.ip_address.includes(search)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#c9d1d9] max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-white flex items-center gap-2">
            <Server size={18} className="text-[#1f6feb]" />
            Connect to System
          </DialogTitle>
          <DialogDescription className="text-[#8b949e]">
            Select a target infrastructure to open a new SSH session.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565f89]" size={14} />
            <Input 
              placeholder="Filter systems by name or IP..."
              className="bg-[#0d1117] border-[#30363d] pl-9 text-xs focus:ring-1 focus:ring-blue-500 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto mt-2 px-2 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 opacity-50">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#565f89]">
              No matching systems found.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(system => (
                <div
                  key={system.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#21262d] transition-all border border-transparent hover:border-[#30363d] group"
                >
                  <div className="flex flex-col items-start w-1/2">
                    <span className="text-sm font-semibold text-white transition-colors truncate w-full">{system.name}</span>
                    <span className="text-[10px] text-[#8b949e] font-mono">{system.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <button 
                      onClick={() => onSelect(system.id, system.name)}
                      className="px-4 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                    >
                      <Terminal size={12} />
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemSelector;

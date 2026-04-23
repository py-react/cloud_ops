import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock, Loader2, Terminal, User, Server, ChevronRight,
  X, Search, Play, Timer, Database, RotateCcw, Activity, History, Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import type { Terminal as XTerm } from 'xterm';
import 'xterm/css/xterm.css';
import PageLayout from "@/components/PageLayout";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";

interface AuditLog {
  id: number;
  session_id: string;
  system_id: number;
  system_name: string;
  user_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  keystroke_count: number;
}

interface ReplayEntry {
  t: string;
  d: string;
}

function formatDuration(secs: number | null): string {
  if (secs === null) return 'Active';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function BastionAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [replayData, setReplayData] = useState<ReplayEntry[]>([]);
  const [loadingReplay, setLoadingReplay] = useState(false);
  
  const replayContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bastion/audit');
      const data = await res.json();
      if (!data.error) setLogs(data.logs);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleViewReplay = async (log: AuditLog) => {
    if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
    if (termRef.current) termRef.current.dispose();
    termRef.current = null;
    setIsPlaying(false);
    isPlayingRef.current = false;
    setReplayProgress(0);
    setReplayData([]);
    
    setSelectedLog(log);
    setLoadingReplay(true);
    try {
      const res = await fetch(`/api/bastion/audit?id=${log.id}`);
      const data = await res.json();
      if (!data.error && data.log) {
        setReplayData(data.log.keystroke_events || []);
      }
    } catch { toast.error('Failed to load session replay'); }
    finally { setLoadingReplay(false); }
  };

  useEffect(() => {
    let isMounted = true;
    const initTerm = async () => {
      if (!selectedLog || !replayContainerRef.current || termRef.current || loadingReplay) return;
      const xtermModule = await import('xterm');
      const fitModule = await import('xterm-addon-fit');
      const Terminal = xtermModule.Terminal;
      const FitAddon = fitModule.FitAddon;
      if (!isMounted || !replayContainerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        theme: {
          background: '#09090b',
          foreground: '#fafafa',
          cursor: '#ffffff',
          black: '#09090b',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#fafafa',
        },
        disableStdin: true
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(replayContainerRef.current);
      fitAddon.fit();
      termRef.current = term;
      
      term.writeln('\x1b[1;36m# ------------------------------------------------\x1b[0m');
      term.writeln(`\x1b[1;36m# Replaying Session:\x1b[0m \x1b[1;32m${selectedLog.session_id}\x1b[0m`);
      term.writeln(`\x1b[1;36m# Identity:\x1b[0m \x1b[1;32m${selectedLog.user_id}\x1b[0m`);
      term.writeln(`\x1b[1;36m# Target:\x1b[0m \x1b[1;32m${selectedLog.system_name}\x1b[0m`);
      term.writeln('\x1b[1;36m# ------------------------------------------------\x1b[0m\r\n\r\n$ ');
    };
    initTerm();
    return () => { isMounted = false; };
  }, [selectedLog, loadingReplay]);

  const startReplay = () => {
    if (!termRef.current || replayData.length === 0) return;
    if (replayProgress >= replayData.length) {
      termRef.current.clear();
      termRef.current.write('\r\n$ ');
      setReplayProgress(0);
    }
    setIsPlaying(true);
    isPlayingRef.current = true;
    let currentIndex = replayProgress >= replayData.length ? 0 : replayProgress;
    const playNext = () => {
      if (!termRef.current || !isPlayingRef.current) return;
      if (currentIndex >= replayData.length) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setReplayProgress(replayData.length);
        return;
      }
      const current = replayData[currentIndex];
      termRef.current.write(current.d);
      setReplayProgress(currentIndex + 1);
      if (currentIndex < replayData.length - 1) {
        const t1 = new Date(current.t).getTime();
        const t2 = new Date(replayData[currentIndex + 1].t).getTime();
        const diff = Math.min(Math.max(t2 - t1, 5), 800); 
        currentIndex++;
        playbackTimeoutRef.current = setTimeout(playNext, diff);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };
    playNext();
  };

  const pauseReplay = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
  };

  const filteredLogs = logs.filter(l =>
    l.system_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.session_id?.includes(searchQuery)
  );

  const columns = [
    {
      header: 'System',
      accessor: 'system_name',
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <Server size={14} className="text-primary" />
          <span className="font-bold text-foreground">{row.system_name}</span>
        </div>
      )
    },
    {
      header: 'Operator',
      accessor: 'user_id',
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <User size={13} className="text-muted-foreground" />
          <span className="text-sm">{row.user_id}</span>
        </div>
      )
    },
    {
      header: 'Started',
      accessor: 'started_at',
      cell: (row: AuditLog) => (
        <span className="text-xs text-muted-foreground font-mono">{formatTime(row.started_at)}</span>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration_seconds',
      cell: (row: AuditLog) => (
        <span className={cn("text-xs font-bold font-mono", row.ended_at ? 'text-muted-foreground' : 'text-emerald-500')}>
          {formatDuration(row.duration_seconds)}
        </span>
      )
    },
    {
      header: 'Traffic',
      accessor: 'keystroke_count',
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-1.5 opacity-70">
          <Database size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-mono">{formatBytes(row.keystroke_count)}</span>
        </div>
      )
    }
  ];

  const metrics = useMemo(() => [
    { title: "Total Sessions", count: logs.length, icon: <History />, color: "bg-blue-500" },
    { title: "Active Sessions", count: logs.filter(l => !l.ended_at).length, icon: <Activity />, color: "bg-emerald-500" },
    { title: "Avg. Duration", count: logs.length ? formatDuration(Math.floor(logs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) / logs.length)) : "N/A", icon: <Timer />, color: "bg-primary" },
  ], [logs]);

  return (
    <PageLayout
      title="Access Auditing"
      subtitle="Complete PTY output stream recordings. Every administrative action is traceable."
      icon={Clock}
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={fetchLogs} variant="outline" size="icon" className="h-9 w-9">
            <RotateCcw size={16} />
          </Button>
        </div>
      }
    >
      <div className="flex h-full gap-6 overflow-hidden">
        {/* Logs Table */}
        <div className={cn("flex flex-col h-full transition-all duration-500 overflow-hidden", selectedLog ? 'w-[45%]' : 'w-full')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-0 mb-6 flex-none">
            {metrics.map((m, i) => (
              <ResourceCard key={i} {...m} isLoading={loading} className="p-3" />
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ResourceTable
              loading={loading}
              title="Session History"
              description="Historical records of all SSH connections."
              icon={<History size={18} />}
              columns={columns}
              data={filteredLogs.map(l => ({ ...l, showActions: false, showViewDetails: true }))}
              tableClassName="max-h-[calc(100vh-420px)] overflow-auto scrollbar-hide"
              extraHeaderContent={
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    type="text"
                    placeholder="Search logs..."
                    className="h-8 pl-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              }
              onViewDetails={(row) => handleViewReplay(row)}
            />
          </div>
        </div>

        {/* Replay Console */}
        {selectedLog && (
          <div className="w-[55%] flex flex-col bg-background border border-border/40 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-500">
            {/* Console Header */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Session Replay</h3>
                  <p className="text-[10px] font-mono text-muted-foreground opacity-70">ID: {selectedLog.session_id}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-8 w-8 rounded-full">
                <X size={16} />
              </Button>
            </div>

            {/* Controls */}
            <div className="p-4 bg-muted/10 border-b border-border/10 flex items-center gap-4">
              <Button 
                onClick={isPlaying ? pauseReplay : startReplay} 
                disabled={replayData.length === 0}
                variant={isPlaying ? "destructive" : "gradient"}
                className="w-32 h-9 font-bold flex items-center gap-2"
              >
                {isPlaying ? (
                  <>Pause</>
                ) : (
                  replayProgress >= replayData.length ? <><RotateCcw size={14} /> Replay</> : <><Play size={14} /> Play</>
                )}
              </Button>

              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-100 ease-linear"
                    style={{ width: `${replayData.length > 0 ? (replayProgress / replayData.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                  <span>Progress</span>
                  <span>{replayProgress} / {replayData.length} packets</span>
                </div>
              </div>
            </div>

            {/* Terminal View */}
            <div className="flex-1 bg-black p-4 relative">
              {loadingReplay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 rounded-2xl">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              )}
              <div className="w-full h-full rounded-2xl border border-white/5 bg-[#09090b] shadow-inner overflow-hidden">
                <div ref={replayContainerRef} className="w-full h-full p-4" />
              </div>
            </div>

            {/* Meta Footer */}
            <div className="grid grid-cols-3 divide-x divide-border/20 border-t border-border/20 bg-muted/10">
              {[
                { label: 'Operator', val: selectedLog.user_id, icon: User },
                { label: 'Duration', val: formatDuration(selectedLog.duration_seconds), icon: Timer },
                { label: 'Net Volume', val: formatBytes(selectedLog.keystroke_count), icon: Database },
              ].map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex flex-col h-full">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 mb-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <item.icon size={12} className="text-primary" />
                    <span className="text-xs font-mono font-medium truncate">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

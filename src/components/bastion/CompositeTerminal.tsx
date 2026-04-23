import React from 'react';
import SSHClient from './SSHClient';
import { X, Plus, Terminal, LayoutDashboard, Copy } from 'lucide-react';

interface TerminalSession {
  id: string;
  systemId: number;
  systemName: string;
}

interface CompositeTerminalProps {
  userId: string;
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSwitchSession: (id: string | 'dashboard') => void;
  onCloseSession: (id: string) => void;
  onDuplicateActive: () => void;
}

const CompositeTerminal: React.FC<CompositeTerminalProps> = ({ 
  userId, 
  sessions, 
  activeSessionId, 
  onSwitchSession, 
  onCloseSession,
  onDuplicateActive
}) => {

  return (
    <div className="flex flex-col h-full bg-[#010409] text-[#c9d1d9]">
      {/* Multiplexer Tab Bar */}
      <div className="flex items-center bg-[#161b22] border-b border-[#30363d] px-2 h-12 overflow-x-auto scroller-hide shrink-0">
        {/* Rapid Navigation Tab */}
        <div
          onClick={() => onSwitchSession('dashboard')}
          className={`flex items-center px-4 h-full cursor-pointer transition-all border-r border-[#30363d] group ${
            activeSessionId === 'dashboard' ? 'bg-[#0d1117] text-white' : 'hover:bg-[#1f6feb]/5 text-[#8b949e]'
          }`}
          title="Back to Systems Dashboard"
        >
          <LayoutDashboard size={14} className={`mr-2 ${activeSessionId === 'dashboard' ? 'text-[#1f6feb]' : 'group-hover:text-[#1f6feb]'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Systems</span>
        </div>

        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSwitchSession(session.id)}
            className={`flex items-center px-4 h-full cursor-pointer border-r border-[#30363d] transition-all min-w-[140px] group ${
              activeSessionId === session.id 
                ? 'bg-[#0d1117] text-white shadow-[inset_0_-2px_0_#1f6feb]' 
                : 'hover:bg-[#1f6feb]/5 text-[#8b949e]'
            }`}
          >
            <div className="flex items-center">
              <Terminal size={12} className={`mr-2 ${activeSessionId === session.id ? 'text-[#1f6feb]' : 'group-hover:text-[#1f6feb]'}`} />
            </div>
            <span className="text-[11px] font-medium mr-3 truncate max-w-[100px]">
              {session.systemName}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseSession(session.id);
                }}
                className="p-1 hover:bg-[#f85149]/20 hover:text-[#f85149] rounded transition-all"
                title="Close session"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Multiplexing Rapid-Add Button */}
        <button 
          type="button"
          className="px-4 h-full hover:bg-[#1f6feb]/10 flex items-center transition-colors text-[#1f6feb] border-r border-[#30363d]"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateActive();
          }}
          title="Duplicate active session"
        >
          <Plus size={18} />
        </button>
      </div>



      {/* Persistent Terminal Viewport */}
      <div className="flex-1 relative bg-[#010409] overflow-hidden">
        {sessions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#484f58]">
            <Terminal size={64} className="mb-4 opacity-10" />
            <p className="text-sm">No active terminals.</p>
          </div>
        )}
        
        {sessions.map(session => (
          <div
            key={session.id}
            className={`w-full h-full absolute inset-0 ${activeSessionId === session.id ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}
          >
            <SSHClient
              systemId={session.systemId}
              sessionId={session.id}
              userId={userId}
              onClose={() => onCloseSession(session.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompositeTerminal;

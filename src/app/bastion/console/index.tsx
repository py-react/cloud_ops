import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTerminal } from '@/components/bastion/TerminalContext';
import CompositeTerminal from '@/components/bastion/CompositeTerminal';
import { Shield, Loader2, Terminal, Plus } from 'lucide-react';
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";

export default function BastionConsolePage() {
  const navigate = useNavigate();
  const { sessions, addSession, activeId, setActiveId, removeSession, isLoaded } = useTerminal();

  const handleSwitchSession = useCallback((id: string | 'dashboard') => {
    if (id === 'dashboard') {
      navigate('/bastion/systems');
    } else {
      setActiveId(id);
    }
  }, [navigate, setActiveId]);

  const handleCloseSession = useCallback((id: string) => {
    removeSession(id);
    if (activeId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[remaining.length - 1].id);
      } else {
        navigate('/bastion/systems');
      }
    }
  }, [activeId, sessions, removeSession, setActiveId, navigate]);

  const handleDuplicateActive = useCallback(() => {
    const activeSession = sessions.find(s => s.id === activeId);
    if (activeSession) {
      addSession({
        systemId: activeSession.systemId,
        systemName: activeSession.systemName
      });
    }
  }, [activeId, sessions, addSession]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <PageLayout 
        title="Access Console" 
        subtitle="Command-line access to your authorized systems."
        icon={Terminal}
      >
        <div className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground">
          <Shield size={64} className="mb-4 opacity-10" />
          <h3 className="text-xl font-bold text-foreground">No active sessions</h3>
          <p className="mt-2 max-w-xs text-center">Start a connection to a target system to begin interacting via the command line.</p>
          <Button 
            onClick={() => navigate('/bastion/systems')}
            variant="gradient" 
            className="mt-6 font-bold"
          >
            <Plus size={16} className="mr-2" /> Start New Session
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Interactive Console" 
      subtitle={`Connected to ${sessions.find(s => s.id === activeId)?.systemName || 'Systems'}`}
      icon={Terminal}
      contentClassName="p-0 px-0" // Flush for terminal
      className="space-y-0"
    >
      <div className="flex-1 flex flex-col bg-background rounded-3xl border border-border/40 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <CompositeTerminal
          userId="admin"
          sessions={sessions}
          activeSessionId={activeId}
          onSwitchSession={handleSwitchSession}
          onCloseSession={handleCloseSession}
          onDuplicateActive={handleDuplicateActive}
        />
      </div>
    </PageLayout>
  );
}
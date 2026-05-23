import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type ConnectionType = 'ssh' | 'rdp';

export interface TerminalSession {
  id: string;
  systemId: number;
  systemName: string;
  connectionType: ConnectionType;
}

interface TerminalContextType {
  sessions: TerminalSession[];
  activeId: string | null;
  addSession: (session: Omit<TerminalSession, 'id'>) => string;
  removeSession: (id: string) => void;
  setActiveId: (id: string | null) => void;
  isLoaded: boolean;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

const SESSIONS_KEY = 'bastion_terminal_sessions';
const ACTIVE_ID_KEY = 'bastion_terminal_active_id';

export const TerminalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_KEY);
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      
      const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedActiveId) {
        setActiveId(savedActiveId);
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (activeId) {
      localStorage.setItem(ACTIVE_ID_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  }, [activeId, isLoaded]);

  const addSession = useCallback((data: Omit<TerminalSession, 'id'>) => {
    const id = `sess-${data.systemId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    setSessions(prev => {
      const instancesOfSameSystem = prev.filter(s => s.systemId === data.systemId);
      const nextIndex = instancesOfSameSystem.length + 1;
      const displayName = nextIndex > 1 ? `${data.systemName} (${nextIndex})` : data.systemName;
      
      const newSession = { ...data, id, systemName: displayName };
      return [...prev, newSession];
    });

    setActiveId(id);
    return id;
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      return remaining;
    });
    setActiveId(currentId => (currentId === id ? null : currentId));
  }, []);

  return (
    <TerminalContext.Provider value={{ sessions, activeId, addSession, removeSession, setActiveId, isLoaded }}>
      {children}
    </TerminalContext.Provider>
  );
};


export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) throw new Error('useTerminal must be used within a TerminalProvider');
  return context;
};
